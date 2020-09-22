import React from 'react';
import {
	Text,
	View,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	Alert
} from 'react-native';

import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';
import Icon from 'react-native-vector-icons/FontAwesome';

function SearchBar(props) {

	_menu = null;

	setMenuRef = ref => {
		_menu = ref;
	};

	onPressRefreshList = () => {
		props.onPressRefreshList();
		_menu.hide();
	}
	
	onPressDeleteAll = () => {
		Alert.alert(
			"Deleting all catcodes.",
			"Are you sure?",
			[
				{
					text: "Cancel",
					onPress: () => {
						_menu.hide();
					},
					style: "cancel"
				},
				{ text: "OK", onPress: () => {
					_menu.hide();
					props.onPressDeleteAll();
			  	} 
				}
			],
			{ cancelable: false }
		);		
	};

	showMenu = () => {
		_menu.show();
	};

	return(
		<View style={styles.container}>

			<TextInput
				placeholder="Search catcode"
				style={styles.textInput}
				onChangeText={text => props.onChangeSearchText(text)}
				value={props.searchText}
				/>

			<Menu
				ref={setMenuRef}
				button={
					<TouchableOpacity 
						style={styles.menubutton}
						onPress={showMenu}>
						<Icon name="ellipsis-v" size={25} color="gray"/>
					</TouchableOpacity>}
			>
				<MenuItem onPress={onPressRefreshList}>Refresh list</MenuItem>
				<MenuItem onPress={onPressDeleteAll}>Delete all</MenuItem>
			</Menu>

		</View>
	);
}

const styles = StyleSheet.create({
	container:{
		flexDirection:'row',
		justifyContent: 'space-between',
		padding: 10,
		paddingBottom:0,
		alignItems: 'center'
	},
	textInput:{
		fontFamily:'monospace',
		fontSize:16,
		flex:0.8
	},
	menubutton:{
		padding:25,
	}
});

export default SearchBar
