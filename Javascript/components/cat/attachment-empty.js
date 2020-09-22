import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

function AttachmentEmpty(props) {
	return(
		<View style={styles.container}>

			<View style={styles.textContainer}>
				<Image style={styles.image} source={require('../../../assets/emptyCat.png')} />
				<Text style={styles.text1}> Wow, such empty </Text>

				{(props.mode === "edit")?
					<Text style={styles.text2}> Attach somethings ⬇️ </Text>
				: null}
			</View>

			{(props.mode === "edit")?
				<View style={styles.buttonContainer}>

					<View style={styles.buttonRow}>

						<TouchableOpacity style={styles.button} onPress={() => props.onAddAttachment("text")}>
							<Text style={styles.buttonText}> text </Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.button} onPress={() => props.onAddAttachment("link")}>
							<Text style={styles.buttonText}> link </Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.button} onPress={() => props.onAddAttachment("tel")}>
							<Text style={styles.buttonText}> tel </Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.button} onPress={() => props.onAddAttachment("pdf")}>
							<Text style={styles.buttonText}> pdf </Text>
						</TouchableOpacity>
					
					</View>

					<View style={styles.buttonRow}>

						<TouchableOpacity style={styles.button} onPress={() => props.onAddAttachment("image")}>
							<Text style={styles.buttonText}> image </Text>
						</TouchableOpacity>
						
						<TouchableOpacity style={(props.proMode) ? styles.button : styles.buttonBlocked} onPress={() => props.onAddAttachment("video")}>
							<Text style={styles.buttonText}> video </Text>
						</TouchableOpacity>

						<TouchableOpacity style={(props.proMode) ? styles.button : styles.buttonBlocked} onPress={() => props.onAddAttachment("audio")}>
							<Text style={styles.buttonText}> audio </Text>
						</TouchableOpacity>
					
					</View>

				</View>
			: null}

		</View>
	);

}

const styles = StyleSheet.create({
	container:{
		flex:1,
		alignItems:'center'
	},
	image:{
		resizeMode:'contain',
		width:160,
		height:160,
		marginTop:25
	},
	textContainer:{
		flex:2.5,
		justifyContent:'center',
		padding:10
	},
	text1:{
		fontFamily:'monospace',
		fontSize:14,
		color:'gray',
		textAlign:'center'
	},
	text2:{
		fontFamily:'monospace',
		fontSize:14,
		color:'gray',
	},
	buttonContainer:{
		flex:1,
		width:'100%',
		alignItems:'center',
		paddingLeft:20,
		paddingRight:20,
		paddingBottom:10,
		alignItems:'center',
		justifyContent:'center'

	},
	buttonRow: {
		flexDirection:'row',
		width:'100%',
		justifyContent:'center'
	},
	button:{
		backgroundColor:'white',
		borderRadius:15,
		justifyContent: 'center',
		alignItems:'center',
		margin:5,
		height:'auto',
		paddingTop:25,
		paddingBottom:25,
		flex:1
	},
	buttonBlocked:{
		backgroundColor:'#40434510',
		borderRadius:15,
		justifyContent: 'center',
		alignItems:'center',
		margin:5,
		height:'auto',
		paddingTop:25,
		paddingBottom:25,
		flex:1
	},
	buttonText:{
		fontSize:12,
		fontFamily:'monospace',
		color:'gray'
	}
});

export default AttachmentEmpty
