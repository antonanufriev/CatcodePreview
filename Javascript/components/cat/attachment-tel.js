import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput
} from 'react-native';

import AttachmentLayout from './attachment-layout';

function AttachmentTel(props) {
	return(
		<AttachmentLayout 
			mode={props.mode}
			onPressRemove={props.onPressRemove}>

			{(props.mode=="edit")?

				<View style={styles.textLinkBox}>

					<Text style={styles.textLabel}>ADD YOUR TEL HERE</Text>

					<TextInput
						multiline
						keyboardType = 'phone-pad'
						placeholder="+30 000111222"
						onChangeText={(text) => props.onChangeNumber(text)}
						value={props.attachment.tel}
						style={styles.textLink}
						autoCorrect={false}
					/>

				</View>
			:
				<View style={styles.linkButtonBox}>
					<TouchableOpacity 
						style={styles.linkButton}
						onPress={props.onPressTel}>

						<Text style={styles.linkButtonText}>
							Call
						</Text>

						<Text style={styles.linkButtonTel}>
							{props.attachment.tel}
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
		flex:1
	},
	linkButton:{
		backgroundColor:'#00CD88',
		alignItems:'center',
		justifyContent:'center',
		borderRadius:15,
		width:200,
		height:200
	},
	linkButtonText:{
		fontFamily: 'monospace',
		fontSize:22,
		color:'white'
	},
	linkButtonTel: {
		fontFamily: 'monospace',
		fontSize:14,
		color:'white'
	}
});

export default AttachmentTel
