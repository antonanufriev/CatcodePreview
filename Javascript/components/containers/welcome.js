import React, {useState, useRef} from 'react';
import {
	Text,
	View,
	Image,
	StyleSheet,
	TouchableOpacity
} from 'react-native';

import Swiper from 'react-native-swiper'

function welcome(props) {

	// create our ref
	const swiperRef = useRef(null);
	const [buttonText, setButtonText] = useState("Next");
	const [tutorialDone, setTutorialDone] = useState(false);

	_onPressNext = () => {
		if (tutorialDone) {
			props.exitWelcome();
		} else {
			swiperRef.current.scrollBy(1);
		}
	}

	_onIndexChanged = (index) =>{
		if (index === 4) {
			setButtonText("Let's start.");
			setTutorialDone(true);
		}
	}

	return(
		<View style={{flex:1}}>
			<Swiper ref={swiperRef} showsButtons={false} onIndexChanged={_onIndexChanged}>
			
				<View style={styles.slide}>
					<Image style={styles.image} source={require('../../assets/Welcome1.png')} />
			      <Text style={styles.text}>A catcode is a hand-drawn code that can be associated with any digital content.</Text>
			   </View>
			   <View style={styles.slide}>
			   	<Image style={styles.image} source={require('../../assets/Welcome2.png')} />
			      <Text style={styles.text}>Use catcodes to enrich your paper notes with text, links, photos, videos, etc.</Text>
			   </View>
			   <View style={styles.slide}>
			   	<Image style={styles.image} source={require('../../assets/Welcome3.png')} />
			      <Text style={styles.text}>A valid catcode is a circle with ears. Inside the circle you can draw anything.  Each catcode must be unique.</Text>
			   </View>
			   <View style={styles.slide}>
			   	<Image style={styles.image} source={require('../../assets/Welcome4.png')} />
			      <Text style={styles.text}>It works like a qr code. Simply scan a catcode and see what's attached.</Text>
			   </View>
			   <View style={styles.slide}>
			   	<Image style={styles.image} source={require('../../assets/Welcome5.png')} />
			      <Text style={styles.text}>You will also find catcode in the share menu of your phone. Use it to attach content faster.</Text>
			   </View>
			</Swiper>

			<View style={styles.buttonContainer}>
				<TouchableOpacity 
					style={styles.skipButton}
					onPress={_onPressNext}>
					<Text style={styles.skipButtonText}>{buttonText}</Text>
				</TouchableOpacity>
			</View>

		</View>
	)
}

const styles = StyleSheet.create({
	slide: {
		flex:1,
		justifyContent:'center',
		alignItems:'center',
		padding:20
	},
	image:{
		width:'90%',
		resizeMode:'contain'
	},
	text:{
		fontFamily:'monospace',
		marginBottom:40
	},
	buttonContainer:{
		flex:0.1,
		padding:20
	},
	skipButton: {
		backgroundColor:'#00CD88',
		padding:20,
		textAlign:'center',
		borderRadius:15,
		width:'auto'
	},
	skipButtonText: {
		fontFamily:'monospace',
		color:'white',
		textAlign:'center',
		fontSize:16
	}
});
export default welcome