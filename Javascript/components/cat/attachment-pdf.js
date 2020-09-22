import React from 'react';
import PDFView from 'react-native-view-pdf';
import {
	View,
	Text,
	StyleSheet,
	TextInput
} from 'react-native';

import AttachmentLayout from './attachment-layout';

function AttachmentPdf(props) {

	let resource = null;
	let resourceType = null;

	if (props.attachment.isSaved) {
		resourceType = "file";
		resource = props.filePath;
	}

	return(
		<AttachmentLayout 
			mode={props.mode}
			onPressRemove={props.onPressRemove}>

			{props.attachment.isSaved?
				<PDFView
	         	fadeInDuration={250.0}
	         	style={{ flex: 1 }}
	         	resource={resource}
	         	resourceType={resourceType}
	         	onLoad={() => console.log('PDF rendered ')}
	         	onError={() => console.log('Cannot render PDF')}
	        	/>
	      : <Text style={styles.savepdftext}> Save to view pdf </Text>}

		</AttachmentLayout>
	);
}

const styles = StyleSheet.create({
	savepdftext:{
		fontFamily:'monospace',
		padding:20,
		textAlign:'center'
	}
});

export default AttachmentPdf
