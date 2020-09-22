import React, {Component} from 'react';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

//Redux import
import {connect} from 'react-redux';
import * as actionTypes from '../store/actions';

import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	Image,
	ScrollView,
	Alert
} from 'react-native';

import RNIap, {
  InAppPurchase,
  PurchaseError,
  acknowledgePurchaseAndroid,
  consumePurchaseAndroid,
  finishTransaction,
  finishTransactionIOS,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';


//Item to purchase
const itemSkus = Platform.select({
	ios: [
		'catcode_pro_v1' //TODO
	],
	android: [
		'catcode_pro_v1'
	]
});

let purchaseUpdateSubscription;
let purchaseErrorSubscription;

class Premium extends Component {

	constructor(props){
		super(props);
		this.state = {
			productList: [], //available products to buy
			purchases: '' //things that user already bought
		 };
	}

	async componentDidMount(): void {	
		try {
			const result = await RNIap.initConnection();
			this.getProducts();
			this.getAvailablePurchases();
		} catch (err) {
			alert("Premium.js 1: " + err);
		}

		purchaseUpdateSubscription = purchaseUpdatedListener(
			async (purchase: InAppPurchase) => {

				//https://developer.android.com/reference/com/android/billingclient/api/Purchase.PurchaseState
				let purchaseStateAndroid = purchase.purchaseStateAndroid;
				//console.log(purchaseStateAndroid);

				if (purchaseStateAndroid === 1) { //if (purchased)
					try {
						const ackResult = await finishTransaction(purchase, false); //false:NON consumable
						if (ackResult.code === "OK") {
							//console.log("transaction successfull");
							alert("Pro Mode is now Active 🎉🎉🎉");
							this.setPro();
						} else {
							//console.log(ackResult);
							alert("Premium.js 2: ackResult error");
						}
					} catch (ackErr) {
						alert("Premium.js 3: " + ackErr);
					}
				}
			},
		);

		purchaseErrorSubscription = purchaseErrorListener(
			(error: PurchaseError) => {
				//console.log(error);
				//console.log('purchaseErrorListener', error);
				alert("Premium.js 4: " + error.message);
			}
		);

	}

	componentWillUnmount(): void {
		if (purchaseUpdateSubscription) {
			purchaseUpdateSubscription.remove();
			purchaseUpdateSubscription = null;
		}
		if (purchaseErrorSubscription) {
			purchaseErrorSubscription.remove();
			purchaseErrorSubscription = null;
		}
		RNIap.endConnection();
	}

	getProducts = async (): void => {
		try {
			const products = await RNIap.getProducts(itemSkus);
			this.setState({productList: products});
		} catch (err) {
			alert("Premium.js 5: " + err);
		}
	};

	//Get all purchases made by the user
	getAvailablePurchases = async (): void => {

		try {
			//Get available purchases (non-consumable or unconsumed consumable
			const purchases = await RNIap.getAvailablePurchases();

			if (purchases && purchases.length > 0) {
				//Check if in purchases there is the itemSkus
				purchases.forEach(purchase => {
					if ((purchase.isAcknowledgedAndroid) && (purchase.productId === itemSkus[0])) {
						//Purchase found
						this.setPro();
					}
				});

				this.setState({
					purchases: purchases
				});

			}
		} catch (err) {
			alert("Premium.js 6: " + err.message);
		}
	};

	// Version 3 apis
	requestPurchase = async (sku): void => {
		try {
			RNIap.requestPurchase(sku).then(res => {
				//console.log(res);
			}).catch((error) => {
				alert("Premium.js 7: " + error);
			});
		} catch (err) {
			alert("Premium.js 8: " + err.message);
		}
	};

	setPro = () => {
		let a = DeviceInfo.getBundleId(); //com.reactnativecacodev2
		let b = DeviceInfo.getUniqueId(); //be7ac4fa862ae850

		try {
			this.props.onSetProMode(true);
			AsyncStorage.setItem('promode', a+b+"catcode_pro_v1");
		} catch {
			Alert.alert("Setup pro mode error. Please contact us: info@catcodeapp.com");
		}
	}

	render(){
		return(
			<ScrollView style={styles.container}>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={require('../../assets/proCat.png')} />
				</View>

				<Text style={styles.text1}>Unlock all the potential of Catcode by purchasing the 🚀 pro version. Here's what you get: </Text>
				
				<View style={styles.feature}>
					<Icon name="check" size={25} color="green"/>
					<Text style={styles.featureText}>Unlimited Catcodes</Text>
				</View>

				<View style={styles.feature}>
					<Icon name="check" size={25} color="green"/>
					<Text style={styles.featureText}>Audio & Video Attachments </Text>
				</View>

				<View style={styles.feature}>
					<Icon name="check" size={25} color="green"/>
					<Text style={styles.featureText}> Share Attachments </Text>
				</View>

				<Text style={styles.text2}>No subscription. Life time license: pay once and use it forever.</Text>

				{this.state.productList.map((product, i) => {
					if (!this.props.proMode){
						return(
							<TouchableOpacity key={product.productId} style={styles.button} onPress={(): void => this.requestPurchase(product.productId)}>
								<Text style={styles.buttonText}>Upgrade for {product.localizedPrice} </Text>
							</TouchableOpacity>
						);
					}
				})}

				{(this.props.proMode)?
					<TouchableOpacity style={styles.button} onPress={null} disabled={true}>
						<Text style={styles.buttonText}>Pro Mode Active 🎉 </Text>
					</TouchableOpacity>
					: null
				}

			</ScrollView>
		);
	}

}

const mapStateToProps = state => {
    return {
        proMode: state.proMode
    };
}
const matDispatchToProps = dispatch => {
    return {
        onSetProMode: (proMode) => dispatch({type: actionTypes.SETPROMODE, value: proMode}), //now dispatch is available as this.onIncrementCounter
    }
}

//Connect Redux
export default connect(mapStateToProps, matDispatchToProps)(Premium);

const styles = StyleSheet.create({
	container: {
		flex:1,
		padding:20
	},
	image:{
		resizeMode:'contain',
		width:160,
		height:160,
		marginBottom:20,
		marginTop:20
	},
	imageContainer:{
		alignItems:'center'
	},
	text1: {
		fontFamily: 'monospace',
		fontSize: 16,
		marginBottom:30
	},
	text2: {
		fontFamily: 'monospace',
		fontSize: 16,
		marginTop:20,
		marginBottom:20
	},
	text3: {
		fontFamily: 'monospace',
		fontSize: 14,
		marginTop:20,
		marginBottom:40
	},
	feature: {
		flexDirection: 'row',
		justifyContent:'space-between',
		alignItems:'center',
		backgroundColor:'white',
		width:'100%',
		padding:10,
		marginBottom:5
	},
	featureText: {
		fontFamily: 'monospace',
		fontSize: 14,
	},
	button: {
		backgroundColor:'#00CD88',
		padding:20,
		marginBottom:60,
		borderRadius:15,
		alignItems:'center'
	},
	buttonText:{
		fontFamily: 'monospace',
		fontSize: 16,
		color:'white'
	},
	buttonNoAvailable: {
		backgroundColor:'gray',
		padding:20,
		borderRadius:15,
		alignItems:'center'
	},

});