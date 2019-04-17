import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View, WebView } from 'react-native';

const ckeditor = require('./ckeditor');

// fix https://github.com/facebook/react-native/issues/10865
const patchPostMessageJsCode = `(${String(function() {
  var originalPostMessage = window.postMessage;
  var patchedPostMessage = function(message, targetOrigin, transfer) {
    originalPostMessage(message, targetOrigin, transfer);
  };
  patchedPostMessage.toString = function() {
    return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
  };
  window.postMessage = patchedPostMessage;
})})();`;

class CKEditor extends React.Component {
  state = {
    webViewNotLoaded: true
  };

  onError = error => {
    Alert.alert('WebView onError', error, [
      { text: 'OK', onPress: () => console.log('OK Pressed') }
    ]);
  };

  renderError = error => {
    Alert.alert('WebView renderError', error, [
      { text: 'OK', onPress: () => console.log('OK Pressed') }
    ]);
  };

  createWebViewRef = webview => {
    this.webview = webview;
  };

  postMessage = payload => {
    // only send message when webview is loaded
    if (this.webview) {
      console.log(`WebViewEditor: sending message ${payload}`);
      this.webview.postMessage(payload);
    }
  };

  handleMessage = event => {
    console.log('event', event);
    let msgData;
    try {
      msgData = event.nativeEvent.data;
      console.log('msgData', msgData);
      this.props.onChange(msgData);
    } catch (err) {
      console.warn(err);
      return;
    }
  };

  onWebViewLoaded = () => {
    console.log('Webview loaded');
    this.setState({ webViewNotLoaded: false });
    this.postMessage(this.props.content);
  };

  showLoadingIndicator = () => {
    return (
      <View style={styles.activityOverlayStyle}>
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" animating={this.state.webViewNotLoaded} color="green" />
        </View>
      </View>
    );
  };

  render() {
    const { maxHeight } = this.props;
    return (
      <WebView
        ref={this.createWebViewRef}
        injectedJavaScript={patchPostMessageJsCode}
        style={{ marginTop: 20 }}
        scrollEnabled={false}
        source={{html: `
        <!DOCTYPE html>
        <html>

        <head>
            <meta charset="utf-8">
            <title>CKEditor</title>
            <script>
              ${ckeditor}
            </script>
            <script>
              document.addEventListener("message", function(data) {
                console.log(data.data);
                editor.setData(data.data);
              });
            </script>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
            .ck-editor__editable {
              max-height: ${maxHeight || 100}px;
          }
            </style>
        </head>

        <body>
        <textarea name="editor1" id="editor1"></textarea>
        <script>
        ClassicEditor
            .create( document.querySelector( '#editor1' ) )
            .then( editor => {
                console.log( editor );
                window.editor = editor;
                editor.model.document.on('change:data', () => {
                  try {
                    window.postMessage(editor.getData(), '*')
                  }
                  catch (e) {
                    alert(e)
                  }
                } );
            } )
            .catch( error => {
                console.error( error );
            } );
          // CKEDITOR.replace('editor1', {
          //   on: {
          //     'instanceReady': function (evt) { evt.editor.execCommand('maximize'); }
          //   }
          // });
        </script>
        </body>

        </html>

        `}}
        scalesPageToFit={false}
        onError={this.onError}
        renderError={this.renderError}
        javaScriptEnabled
        onLoadEnd={this.onWebViewLoaded}
        onMessage={this.handleMessage}
        renderLoading={this.showLoadingIndicator}
        mixedContentMode="always"
      />
    );
  }
}

const styles = StyleSheet.create({
  activityOverlayStyle: {
    ...StyleSheet.absoluteFillObject,
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 0
  },
  activityIndicatorContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowRadius: 5,
    shadowOpacity: 1.0
  }
});

export default CKEditor;
