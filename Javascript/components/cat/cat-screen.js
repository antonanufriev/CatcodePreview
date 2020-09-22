import React from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	Dimensions,
	SafeAreaView,
	ScrollView
} from 'react-native';

import AttachmentEmpty from './attachment-empty';
import AttachmentText from './attachment-text';
import AttachmentLink from './attachment-link';
import AttachmentImage from './attachment-image';
import AttachmentAudioVideo from './attachment-audio-video';
import AttachmentTel from './attachment-tel';
import AttachmentPdf from './attachment-pdf';

import Icon from 'react-native-vector-icons/FontAwesome';

function CatScreen(props) {

	let attachmentDOM = null;

	//Check if attachment exist
	//use id, because attachment can be an empty object (not null)
	if (props.attachment) {

		//console.log(props.attachment);

		if (props.attachment.type === "text") {
			
			attachmentDOM = <AttachmentText 
				mode={props.mode}
				attachment={props.attachment}
				onPressRemove={props.onPressRemove}
				onChangeText={props.onChangeText}
			/>

		} else if (props.attachment.type === "link"){

			attachmentDOM = <AttachmentLink
				mode={props.mode}
				attachment={props.attachment}
				onPressRemove={props.onPressRemove}
				onChangeLink={props.onChangeLink}
				onPressLink={props.onPressLink}
			/>

		} else if (props.attachment.type === "image") {

			//Create the file path
			let filePath = null; 
			//If isSaved, get the file from SD, inside app folder
			if (props.attachment.isSaved) {
				filePath = "file://" + props.sdpath + "/" + props.attachment.id + "." + props.attachment.extension;
			} else {
				//Else, use the temporary uri
				filePath = props.attachment.uri;
			}

			attachmentDOM = <AttachmentImage 
				mode={props.mode}
				onPressRemove={props.onPressRemove}

				filePath={filePath}
			/>
		} else if (props.attachment.type === "video") {

			//Create the file path
			let filePath = null; 
			//If isSaved, get the file from SD, inside app folder
			if (props.attachment.isSaved) {
				filePath = "file://" + props.sdpath + "/" + props.attachment.id + "." + props.attachment.extension;
			} else {
				filePath = props.attachment.uri;
			}

			attachmentDOM = <AttachmentAudioVideo 
				mode={props.mode}
				onPressRemove={props.onPressRemove}
				filePath={filePath}
			/>

		} else if (props.attachment.type === "audio") {

			//Create the file path
			let filePath = null; 
			//If isSaved, get the file from SD, inside app folder
			if (props.attachment.isSaved) {
				filePath = "file://" + props.sdpath + "/" + props.attachment.id + "." + props.attachment.extension;
			} else {
				filePath = props.attachment.uri;
			}

			attachmentDOM = <AttachmentAudioVideo 
				type={props.attachment.type}
				mode={props.mode}
				onPressRemove={props.onPressRemove}
				filePath={filePath}
			/>

		} else if (props.attachment.type === "tel") {

			attachmentDOM = <AttachmentTel
				mode={props.mode}
				attachment={props.attachment}
				onPressRemove={props.onPressRemove}

				onPressTel={props.onPressTel}
				onChangeNumber={props.onChangeNumber}
			/>
		} else if (props.attachment.type === "pdf") {

			//Create the file path
			let filePath = null; 
			//If isSaved, get the file from SD, inside app folder
			if (props.attachment.isSaved) {
				filePath = props.sdpath.replace("/storage/emulated/0/", "/sdcard/") + "/" + props.attachment.id + ".pdf";
			}

			attachmentDOM = <AttachmentPdf
				mode={props.mode}
				filePath={filePath}
				attachment={props.attachment}
				onPressRemove={props.onPressRemove}
			/>
		}
	} else {
		//Add empty screen with buttons
		attachmentDOM = <AttachmentEmpty 
			proMode={props.proMode}
			mode={props.mode} 
			onAddAttachment={props.onAddAttachment}/>
	}

	return(
		
		<View style={styles.container}>
			<View style={styles.header}>

				<View style={styles.headerTextBox}>
					<TextInput
						style={(props.mode === "edit")? [styles.catnameEditable, styles.catname] : styles.catname}
						maxLength={20}
						onChangeText={name => props.onChangeCatName(name)}
						value={props.name}
						editable={(props.mode === "edit")}
					/>

					{(props.mode === "view")?
						<Text style={styles.timestamp}>
							{props.timestamp}
						</Text>
						: null
					}
				</View>

				<View style={styles.headerButtons}>
					{(props.mode === "edit")?
						<TouchableOpacity
							style={styles.headerButton}
							onPress={props.onPressCancel}
						>
							<Icon name="times" size={20} color="white"/>
							<Text style={styles.headerButtonText}> CANCEL </Text>
						</TouchableOpacity>
						: 
						<TouchableOpacity
							style={styles.headerButton}
							onPress={() => props.onPressShare(props.attachment)}
						>
							<Icon name="share" size={20} color="white"/>
							<Text style={styles.headerButtonText}> SHARE </Text>
						</TouchableOpacity>
					}

					{(props.mode === "edit")?
						<TouchableOpacity
							style={styles.headerButton}
							onPress={props.onPressSave}
							disabled={props.saveWaiting}
						>
							<Icon name="save" size={20} color="white"/>
							<Text style={styles.headerButtonText}> SAVE </Text>
						</TouchableOpacity>
						:
						<TouchableOpacity
							style={styles.headerButton}
							onPress={props.onPressEdit}
						>
							<Icon name="edit" size={20} color="white"/>
							<Text style={styles.headerButtonText}> EDIT </Text>
						</TouchableOpacity>
					}
				</View>
			</View>

			{attachmentDOM}
		</View>
	);

}

const styles = StyleSheet.create({
	container: {
		backgroundColor:'#f0f0f0',
		flex:1
	},
	header: {
		flexDirection: 'row',
		justifyContent: "space-between",
		backgroundColor: '#00CD88',
		alignItems: 'center',
		padding:10,
		zIndex:100
	},
	timestamp:{
		color: 'white',
		fontFamily:'monospace',
		fontSize:12,
		paddingLeft:10,
		marginTop:-10,
		marginBottom:10
	},
	headerButtons: {
		flexDirection:'row'
	},
	headerButton: {
		alignItems:'center',
		padding:10,
	},
	headerButtonText: {
		color: 'white',
		fontFamily:'monospace',
		fontSize:12,
		marginTop:5
	},
	catname:{
		color: 'white',
		fontSize:16,
		fontFamily:'monospace',
		paddingLeft:10,
		paddingRight:10,
		textAlign:'center'
	},
	catnameEditable: {
		backgroundColor:'#009764',
		borderRadius:15,
	}
});

export default CatScreen
