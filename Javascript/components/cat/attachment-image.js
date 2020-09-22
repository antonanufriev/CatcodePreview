import React from 'react';
import {
	View,
	StyleSheet,
	Image
} from 'react-native';

import AttachmentLayout from './attachment-layout';
import ReactNativeZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';

function AttachmentImage(props) {
	
	return(
		<AttachmentLayout 
			style={{zIndex:10}}
			mode={props.mode}
			onPressRemove={props.onPressRemove}>

			<ReactNativeZoomableView
			   maxZoom={1.4}
			   minZoom={0.8}
			   zoomStep={0.5}
			   initialZoom={1}
			   bindToBorders={true}
			   onZoomAfter={null}
			   style={{
			      zIndex:0
			   }}
			>
			   <Image
				    style={styles.image}
				    source={{ uri: props.filePath }}
				/>
			</ReactNativeZoomableView>
			

		</AttachmentLayout>
	);

}

const styles = StyleSheet.create({
	image: {
		width: '100%', 
		height: '100%',
		resizeMode:'contain',
		zIndex:0
	}
});

export default AttachmentImage
