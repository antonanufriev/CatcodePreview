import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput
} from 'react-native';

import AttachmentLayout from './attachment-layout';

function AttachmentLink(props) {
	return(
		<AttachmentLayout 
			mode={props.mode}
			onPressRemove={props.onPressRemove}>

			{(props.mode=="edit")?

				<View style={styles.textLinkBox}>

					<Text style={styles.textLabel}>ADD YOUR URL HERE</Text>

					<TextInput
						multiline
						placeholder="Example: yourlink.com"
						onChangeText={(text) => props.onChangeLink(text)}
						value={props.attachment.uri}
						style={styles.textLink}
						autoCorrect={false}
					/>

				</View>
			:
				<View style={styles.linkButtonBox}>
					<TouchableOpacity 
						style={styles.linkButton}
						onPress={props.onPressLink}>

						<Text style={styles.linkButtonText}>
							Open Link
						</Text>

						<Text style={styles.linkButtonText2}>
							{props.attachment.uri}
						</Text>

					</TouchableOpacity>
				</View>
			}

		</AttachmentLayout>
	);
}

const styles = StyleSheet.create({
	textLinkBox:{
		justifyContent:'center',
		flex:1
	},
	textLabel:{
		color:'#009764',
		fontSize: 16,
		fontFamily:'monospace',
		textAlign:'center'
	},
	textLink: {
		fontSize: 16,
		fontFamily:'monospace',
		textAlign:'center',
	},
	linkButtonBox: {
		alignItems:'center',
		justifyContent:'center',
		flex:1,
		padding:20
	},
	linkButton:{
		backgroundColor:'#00CD88',
		alignItems:'center',
		justifyContent:'center',
		borderRadius:15,
		padding:20
	},
	linkButtonText:{
		fontFamily: 'monospace',
		fontSize:22,
		color:'white'
	},
	linkButtonText2: {
		fontFamily: 'monospace',
		fontSize:12,
		color:'white',
		padding:10
	}

});

export default AttachmentLink
