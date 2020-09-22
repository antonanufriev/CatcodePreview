import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	ScrollView
} from 'react-native';


import AttachmentLayout from './attachment-layout';


function AttachmentText(props) {
	return(

		<AttachmentLayout 
			mode={props.mode}
			onPressRemove={props.onPressRemove}>

			<ScrollView style={styles.scroll}>
				<TextInput
					multiline
					placeholder="Add your text notes here."
					onChangeText={(text) => props.onChangeText(text)}
					value={props.attachment.text}
					style={styles.textinput}
					autoCorrect={false}
					editable={(props.mode === "edit")}
				/>
			</ScrollView>

		</AttachmentLayout>
	);

}

const styles = StyleSheet.create({
	scroll:{
	},
	textinput: {
		fontFamily:'monospace',
		fontSize:16,
		color: 'black',
		padding:20,
		flex:1,
		backgroundColor:'#e6e6e6'
	}
});

export default AttachmentText
