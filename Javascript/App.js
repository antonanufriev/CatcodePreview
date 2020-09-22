/**
 * App
 *
 * @format
 * @flow strict-local
 */

 /*
	
	APP palette:
		green darker: 009764
		green: 00CD88
		blue: 339CD3
		gray: 7A7A7A
		gray/black: 333533
		white: FFFFFF
	
	Commands:
		npx react-native start
		npx react-native run-android

 */

//React import
import React, {Component} from 'react';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';
import DeviceInfo from 'react-native-device-info';
import SplashScreen from 'react-native-splash-screen'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

//Custom Components
import Home from './src/js/navigation/home';
import Cat from './src/js/containers/cat';
import WelcomeScreen from './src/js/containers/welcome';

//Redux import
import {connect} from 'react-redux';
import * as actionTypes from './src/js/store/actions';

const Stack = createStackNavigator();

const firstLaunchToken = "ABCDEFGHILMNOPQRSTUVZ"; //Change this to debug

class App extends Component {
	constructor(props){
		super(props);
		this.state = {
			showWelcome: null
		}
	}

	componentDidMount(){

		//Check if first launch
		AsyncStorage.getItem(firstLaunchToken).then(value => {
			if(value == null){
				this.setState({
					showWelcome:true
				});
			} else{
				this.setState({
					showWelcome:false
				});
			}
		});

		//Check proMode
		AsyncStorage.getItem('promode').then(value => {
			if(value){
				//Create a string combining various things:
				let a = DeviceInfo.getBundleId(); //com.digitalbore.catcode
				let b = DeviceInfo.getUniqueId(); //be7ac4fa862ae850

				//TODO find a light typy of encryption (?)
				if (value === (a+b+"catcode_pro_v1")) {
					this.props.onSetProMode(true); //dispatch action
				}
			}
		});

		//Hide splash screen
		SplashScreen.hide();
	}

	/*
	exitWelcome
	-------------------
	set showWelcome false
	*/
	exitWelcome= () =>{
		AsyncStorage.setItem(firstLaunchToken, "true");
		this.setState({
			showWelcome:false
		});
	}

	render() {
		let mainDOM = null;
		if(this.state.showWelcome === true){
			mainDOM = <WelcomeScreen exitWelcome={this.exitWelcome}/>
		} else if(this.state.showWelcome === false) {
			mainDOM = (
				<NavigationContainer>
					<Stack.Navigator>

						<Stack.Screen 
							name="Home" 
							component={Home}
							options={{ 
								headerShown: false
							}} />        
						
						<Stack.Screen 
							name="Cat" 
							component={Cat} 
							options={{ 
								title: '',
								headerStyle: {
									backgroundColor: '#009764',
								},
								headerTintColor: '#FFFFFF'
							}}
						/>

					</Stack.Navigator>
				</NavigationContainer>
			);  
		}

		return mainDOM
	}
	
}

//Redux props dispatch
const matDispatchToProps = dispatch => {
    return {
        onSetProMode: (proMode) => dispatch({type: actionTypes.SETPROMODE, value: proMode}),
    }
}

//Connect Redux
export default connect(null, matDispatchToProps)(App);

