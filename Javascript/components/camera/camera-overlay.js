import React from 'react';
import { Dimensions, View, Text, TouchableHighlight, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, Rect, Mask, Polygon } from 'react-native-svg';

const { height, width } = Dimensions.get('window');

function CameraOverlay(props) {  
	
	const viewBox = `0 0 ${width} ${height}`
	
	const catR = width / 5; //Raggio del cerchio
	const catCX = width / 2; //centro x del cerchio
	const catCY = height / 2; //centro y del cerchio

	//Cat ears draw
	const AX = catCX - 0.85*catR;
	const AY = catCY;
	const BX = catCX - 1.1*catR;
	const BY = catCY - 1.3*catR;
	const CX = catCX;
	const CY = catCY - catR*0.7;
	const DX = catCX + 1.1*catR;
	const DY = catCY - 1.3*catR;
	const EX = catCX + 0.85*catR;
	const EY = catCY;

	return (
		<View>
			<TouchableHighlight onPress={props.catPressed} disabled={props.takePictureWaiting}>
				<Svg
				 height={height}
				 viewBox={viewBox}
				>
					<Defs>
						<Mask id="mask">
							<Rect height={height} width={width} fill="#fff" />
							<Polygon
							 points={AX + "," + AY + " " + BX + "," + BY + " " + CX + "," + CY + " " + DX + "," + DY + " " + EX + "," + EY} //"40,5 70,80 25,95"
							 fill="#000"
							/>
							<Circle r={catR} cx={catCX} cy={catCY} fill="#000" />
						</Mask>
					</Defs>

					<Rect
						height={height}
						width={width}
						fill="#0000008a"
						mask="url(#mask)"
					/>

					{props.takePictureWaiting?
						<Text style={styles.text}> Loading...  </Text>
						:<Text style={styles.text}> Press to Scan </Text>
					}

				</Svg>


			</TouchableHighlight>

			<View style={styles.tips}>
				<TouchableOpacity 
					style={styles.tipsButton}
					onPress={props.onPressTips}>
					<Text style={styles.tipsButtonText}>Tips</Text>
				</TouchableOpacity>
			</View>

			{props.externalShareFile?
				<View style={styles.share}>
					<Text style={styles.textShare}> Find a catcode to attach it to.</Text>
					<TouchableOpacity 
						style={styles.cancelButton}
						onPress={props.onPressCancel}>
						<Text style={styles.cancelButtonText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			: null}
		</View>
	);
};

const styles = StyleSheet.create({
	text:{
		color:'#b2b2b28a',
		fontFamily:'monospace',
		position:'absolute',
		top:height/1.3,
		width:width,
		textAlign:'center'
	},
	share:{
		position:'absolute',
		width:'100%',
		flex:1,
		justifyContent:'center',
		alignItems: 'center',
		top:height/10
	},
	textShare:{
		backgroundColor:'#00CD88',
		color:'white',
		borderRadius:15,
		fontFamily:'monospace',
		fontSize:16,
		padding:10
	},
	cancelButton:{
		padding:10
	},
	cancelButtonText:{
		fontFamily:'monospace',
		color:'white'
	},
	tips:{
		flex:1,
		position:'absolute',
		top:height/10,
		justifyContent:'center',
		alignItems:'center',
		width:width
	},
	tipsButton:{
		padding:20,
		width:width/3
	},
	tipsButtonText:{
		fontFamily:'monospace',
		color:'#00CD88',
		textAlign:'center'		
	}
});
export default CameraOverlay;