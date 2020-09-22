import React from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	Linking
} from 'react-native';

import DeviceInfo from 'react-native-device-info';

function MoreScreen({ navigation }) {
	
	_onPressLink = (uri) => {
		Linking.canOpenURL(uri).then(supported => {
			if (!supported) {
				alert("MoreScreen.js: can\'t handle url: " + uri);
			} else {
				return Linking.openURL(uri);
			}
		}).catch(err => alert("MoreScreen.js: " + err));
	}

	return(
		<View style={styles.container}>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={require('../../../assets/header.jpg')} />
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.boxPrimary} onPress={() => navigation.navigate("Premium")}>
					<Text style={styles.textPrimary}>Unlock Catcode Pro 🚀</Text>
		      </TouchableOpacity>

		      <TouchableOpacity style={styles.box} onPress={() => _onPressLink("https://www.catcodeapp.com")}>
					<Text style={styles.text}>How it works</Text>
		      </TouchableOpacity>

	      	<TouchableOpacity style={styles.box} onPress={() => _onPressLink("mailto:info@catcodeapp.com")}>
					<Text style={styles.text}>Bugs & Feedbacks Report</Text>
	      	</TouchableOpacity>

	      	<TouchableOpacity style={styles.box} onPress={() => _onPressLink("https://www.catcodeapp.com/about")}>
					<Text style={styles.text}>About</Text>
	      	</TouchableOpacity>

	      	<TouchableOpacity style={styles.box} onPress={() => _onPressLink("https://www.catcodeapp.com/terms")}>
					<Text style={styles.text}>Terms and Conditions</Text>
	      	</TouchableOpacity>

	      	<TouchableOpacity style={styles.boxVersion} disabled={true}>
					<Text style={styles.text}>{"App version: " + DeviceInfo.getVersion()}</Text>
	      	</TouchableOpacity>

	      </View>
	    </View>
	);
}

const styles = StyleSheet.create({
	container:{
		flex:1,
		flexDirection:'column'
	},
	imageContainer: {
		height: 200
	},
	buttonContainer: {
	},
	image: {
		width: '100%', 
		height: '100%',
		resizeMode:'cover'
	},
	boxPrimary: {
		padding:30,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#00CD88',
		marginBottom: 3
	},
	textPrimary: {
		fontFamily: 'monospace',
		fontSize: 16,
		color: 'white',
		fontWeight: 'bold'
	},
	box: {
		padding:30,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'white',
		marginBottom: 3
	},
	boxVersion:{
		padding:30,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#f6f8fa',
		marginBottom: 3
	},
	text: {
		fontFamily: 'monospace',
		fontSize: 16,
		color: 'black'
	}
});

export default MoreScreen
