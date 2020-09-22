import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity
} from 'react-native';

function AttachmentLayout(props) {
	return(
		<View style={styles.container}>
			<View style={styles.main}>
				{props.children}
			</View>

			{(props.mode=="edit")?
				<View style={styles.footer}>

					<TouchableOpacity 
						onPress={props.onPressRemove}
						style={styles.footerButton}
					>
						<Text style={styles.footerButtonText}>REMOVE ATTACHMENT</Text>
					</TouchableOpacity>

				</View>
				: null
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container:{
		flex:1,
		//backgroundColor:'red'
	},
	main:{
		flex:10
	},
	footer: {
		flex:1,
		flexDirection:'row',
		alignItems:'center',
		justifyContent:'space-around',
		//backgroundColor:'#cdcdcd'
	},
	footerButton: {
		padding:20,
		backgroundColor:'#d17171',
		width:'100%'
	},
	footerButtonText: {
		fontFamily:'monospace',
		color:'white',
		fontWeight:'bold',
		textAlign:'center'

	}
})

export default AttachmentLayout