import React, {Component} from 'react';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-community/async-storage';

//Custom component import
import ListScreen from '../components/list/list-screen';
import SearchBar from '../components/list/search-bar';

//Native modules import
import CatcodeNative from '../../NativeModules/CatcodeNative';

import {
	View
} from 'react-native';

class List extends Component {

	constructor(props){
		super(props);
		this.state = {
			catcodes: [], //Store the list of the catcodes

			catcodesFiltered:[], //sub set of catcode, after apply filter 
			searchText: ""
		}
	}

	componentDidMount(){
		this.listCatcodes();

		//Add listener, so list is refreshed when this component appears
		this.props.navigation.addListener('focus', () => {
			this.listCatcodes();
		});
	}

	componentWillUnmount(){
		this.props.navigation.removeListener('focus');
	}

	
	/* ---------------------------------------------------------------- methods */

	/*
		listCatcodes
		-------------------
		get the catcode list from native modules
	*/
	listCatcodes = () => {
		CatcodeNative.getCatcodeList(error => {
			alert("List.js: " + error);
		}, (catcodes) => {
			this.setState({
				catcodes: JSON.parse(catcodes),
				catcodesFiltered: JSON.parse(catcodes)
			});
		});
	}

	/*
		onCatPressed
		-------------------
		press on a catcode
	*/
	onCatPressed = (id) => {
		this.props.navigation.navigate("Cat", {
			id: id,
			mode: "view"
		});
	}

	/*
		onPressDelete
		-------------------
		press delete single catcode button
	*/
	onPressDelete = (id) => {

		//TODO, add prompt
		CatcodeNative.deleteCatcode(id, error => {
			// error handling
		}, (success) => {
			this.listCatcodes();
		});
	}

	/*
		onChangeSearchText
		-------------------
		on change search text
	*/
	onChangeSearchText = (text) => {
		//Create a copy of catcodes:
		let catcodesFiltered = [];
		if (text) {
			catcodesFiltered = this.state.catcodes.filter(function (item) { return item.name.toLowerCase().indexOf(text.toLowerCase()) !== -1; });
			this.setState({
				catcodesFiltered: catcodesFiltered
			});
		} else {
			this.setState({
				catcodesFiltered: this.state.catcodes
			});
		}
		
		this.setState({
			searchText: text,
		});
	}

	/*
		onPressDeleteAll
		-------------------
		press delete all button
	*/
	onPressDeleteAll = () => {
		CatcodeNative.deleteAllCatcode(error => {
					// error handling
		}, (success) => {
			this.listCatcodes();
		});
	}

	/*
		onPressRefreshList
		-------------------
		press refresh list button
	*/
	onPressRefreshList = () =>{
		this.listCatcodes();
	}

	/* ---------------------------------------------------------------- render */
	
	render(){
		return(
			<View>
				<SearchBar 
					searchText={this.state.searchText}
					onChangeSearchText={this.onChangeSearchText}
					onPressDeleteAll={this.onPressDeleteAll}
					onPressRefreshList={this.onPressRefreshList}/>

				<ListScreen 
					catcodes={this.state.catcodesFiltered} 
					onCatPressed={this.onCatPressed}
					onPressDelete={this.onPressDelete}
				/>
			</View>
		)
	}
}

export default List;