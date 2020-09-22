import React from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	FlatList,
	Alert
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

function ListScreen(props) {

	onPressDeleteThis = (id) => {
		Alert.alert(
			"Deleting this catcode.",
			"Are you sure?",
			[
				{
					text: "Cancel",
					onPress: () => {
					},
					style: "cancel"
				},
				{ text: "OK", onPress: () => {
					props.onPressDelete(id);
			  	} 
				}
			],
			{ cancelable: false }
		);		
	}

	return(
		<SafeAreaView style={styles.container}>
	      	<FlatList
		        data={props.catcodes}
		        keyExtractor={item => item.name}
		        renderItem={({ item }) => (
		        	<TouchableOpacity style={styles.cat} onPress={() => props.onCatPressed(item.id)}>

		        		<View>
		          		<Text style={styles.catDetailText}>{item.name}</Text>
		          		<Text style={styles.catDetailSubText}>{item.timestamp}</Text>
		          	</View>

		          	<TouchableOpacity
		          		style={styles.deleteButton}
							onPress={() => onPressDeleteThis(item.id)}>
							<Icon name="trash" size={18} color="red"/>
						</TouchableOpacity>

		          	</TouchableOpacity>
		        )}
		      />
   	 	</SafeAreaView>
	);

}

const styles = StyleSheet.create({
	container: {
		padding: 10,
		paddingBottom:200, //Avoid hiding last cat
	},
	cat: {
		padding:20,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'white',
		marginBottom: 10,
		borderRadius:15
	},
	catDetailText: {
		fontFamily: 'monospace',
		fontSize: 16
	},
	catDetailSubText: {
		fontFamily: 'monospace',
		fontSize: 12
	},
	deleteButton:{
		padding:10,
		paddingRight:20,
		paddingLeft:20
	}
});

export default ListScreen
