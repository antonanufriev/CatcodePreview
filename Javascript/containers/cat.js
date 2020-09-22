import React, {Component} from 'react';

//Import libraries
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker from 'react-native-image-picker';
import Video from 'react-native-video';
import {Alert, Keyboard, Linking, PermissionsAndroid} from 'react-native';

//Custom componenst
import CatScreen from '../components/cat/cat-screen';

//Native module
import CatcodeNative from '../../NativeModules/CatcodeNative';

//Redux import
import {connect} from 'react-redux';
import * as actionTypes from '../store/actions';

// require the fs module
var RNFS = require('react-native-fs');

/*
	Navigation:
	There are several way we navigate to this Cat components:

	1. From Scan/Camera, if a new cat is found (mode: "edit", id: null)
	2. From Scan/Camera if an old cat is found (mode: "view", id: "XXXX")
	3. From List clicking on a cat (mode: "view", id: "XXXX")
*/


class Cat extends Component {

	constructor(props){
		super(props);
		this.state = {

			//catcode
			id: null, //catcode id
			name: null, // catcode name
			timestamp: null, //catcode creation timestamp
			attachment: null, // catcode attachment
			attachmentTemp: null, //catcode attachment temporary (used to cancel edited content)
				
			//FLAG State
			saveWaiting: false, //True during saving. Avoid double click on save
			mode: "", //view or edit
			isNewCatcode: false, //true when catcode is new
			
			sdpath: RNFS.ExternalDirectoryPath //Store the sd path
		}
	}

	componentDidMount(){

		//Access route params
		//When navigate to Cat, these parameters must be passed
		const mode = this.props.route.params.mode; //view or edit
		const id = this.props.route.params.id; //id of the cat found or null

		if (mode == "view") {
			if (id) { //Old catcode (mode: view, id: XXXXX)
				CatcodeNative.getCatcode(id, error => {
					alert('Cat.js:' + error);
				}, (name, timestamp, attachment) => {
					this.setState({
						name: name,
						id: id,
						timestamp: timestamp,
						mode: mode,
						attachment: JSON.parse(attachment),
						attachmentTemp: JSON.parse(attachment)
					});
				});
			}
		} else if (mode == "edit") {
			if (!id) { //New catcode (mode: edit, id: null)
				this.setState({
					mode: mode,
					name: generateName(),
					timestamp: "",
					attachment: null,
					attachmentTemp: null,
					isNewCatcode: true
				});
			}
		}

		//This allow dismissing the keyboard when user press back on keyboard
		this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
	}
	

	/* ------------------------------------------------------------- CatScreen method */

	keyboardDidHide = () => {
		Keyboard.dismiss();
	};
	
	/* 
		onPressEdit
		-----------------------
		Press edit button 
	*/
	onPressEdit = () => {
		this.setState({
			mode: "edit"
		});
	}

	/* 
		onPressCancel
		-----------------------
		Press cancel button 
	*/
	onPressCancel = () => {
		this.setState({
			mode: "view",
			attachmentTemp: this.state.attachment
		});
	}

	/*
		onPressShare
		----------------------------
		Press on share button
	*/
	onPressShare = (attachment) => {

		if(this.props.proMode){

			let message = '';
			let url = '';

			if (attachment.type === "text") {
				message = attachment.text;
			} else if (attachment.type === "tel"){
				message = attachment.tel;
			} else if (attachment.type === "link"){
				url = attachment.uri;
			} else if ((attachment.type === "image")||(attachment.type === "video")||(attachment.type === "audio")){
				if (attachment.isSaved) {
					//const fileExtension = attachment.uri.split('.').pop();
					const fileExtension = attachment.extension;
					url = "file://" + this.state.sdpath + "/" + attachment.id + "." + fileExtension;
				} else {
					Alert.alert(
						"Ops 😿",
						"Save the Catcode before share it.",
						[
							{
								text: "Got it",
								style: "cancel"
							}
						],
						{ cancelable: true }
					);
				}
			} else if (attachment.type === "pdf"){
				if (attachment.isSaved) {
					url = "file://" + this.state.sdpath + "/" + attachment.id + ".pdf";
				} else {
					Alert.alert(
						"Ops 😿",
						"Save the Catcode before share it.",
						[
							{
								text: "Got it",
								style: "cancel"
							}
						],
						{ cancelable: true }
					);
				}
			}

			if (message || url) {

				const options = Platform.select({
					//TODO IOS
					default: {
						message: message,
						url: url
					},
				});

				Share.open(options).then((res) => { 
					//console.log(res); 
				}).catch((err) => { 
					//alert('Cat.js:' + err);
				});
			}
		} else {
			Alert.alert(
				"Ops 😿",
				"This is not included in the basic version.\n\nContribute to catcode development by offering us a beer 🍺. No subscription. Unlock all the pro features forever! 🎉",
				[
					{
						text: "Cancel",
						style: "cancel"
					},
					{ text: "About Pro", onPress: () => {
						this.props.navigation.navigate('More');
					} }
				],
				{ cancelable: false }
			);
		}
	}

	/* 
		onChangeCatName
		-------------------------
		On Change the catcode name
	*/
	onChangeCatName= (name)=>{
		this.setState({
			name: name
		});      
	}

	/* 
		onPressRemove
		-----------------------
	*/
	onPressRemove = () => {
		this.setState({
			attachmentTemp: null
		});
	}

	/* 
		onPressSave
		-----------------------
		Press on save button
	*/
	onPressSave = () => {

		this.setState({
			saveWaiting: true
		});
		
		//A copy of attachment
		let attachmentTemp = null;

		//If not empty null and change the isSaved flag
		if (this.state.attachmentTemp) {
			attachmentTemp = Object.assign({}, this.state.attachmentTemp); //Copy the object
			//Change isSaved FLAG
			if ((attachmentTemp.type === "image")||(attachmentTemp.type === "video")||(attachmentTemp.type === "audio")||(attachmentTemp.type === "pdf")) {
				attachmentTemp.isSaved = true
			}
		}		

		//Check if call newCatcode or updateCatcode
		if (this.state.isNewCatcode) {
			CatcodeNative.newCatcode(this.state.name, JSON.stringify(attachmentTemp), error => {            
				alert("Cat.js:" + error);
				this.setState({
					saveWaiting: false
				});
			}, (success) => {
				Alert.alert(
					"Great 🐱",
					"Your catcode has been successfully saved",
					[
						{ text: "OK" }
					],
					{ cancelable: true }
				);

				this.setState({
					saveWaiting: false,
					isNewCatcode: false,
					mode:"view",
					attachment: attachmentTemp, //update main attachment
					attachmentTemp: attachmentTemp 
				});
			});
		} else {
			CatcodeNative.updateCatcode(this.state.id, this.state.name, JSON.stringify(attachmentTemp), error => {            
				alert("Cat.js:" + error);
				this.setState({
					saveWaiting: false
				});
			}, (success) => {
				Alert.alert(
					"Great 🐱",
					"Your catcode has been successfully updated",
					[
						{ text: "OK" }
					],
					{ cancelable: true }
				);
				this.setState({
					saveWaiting: false,
					mode:"view",
					attachment: attachmentTemp,
					attachmentTemp: attachmentTemp
				});
			});
		}
	}

	/* 
		onAddAttachment
		-----------------------
		When user confirm adding somethings
		- attachmentType: text, audio, video, image, tel, link
	*/
	onAddAttachment = (attachmentType) => {

		//Check if block the action:
		if ((!this.props.proMode)&&((attachmentType==="video")||(attachmentType==="audio"))) {
			Alert.alert(
				"Ops 😿",
				"This is not included in the basic version.\n\nContribute to catcode development by offering us a beer 🍺. No subscription. Unlock all the pro features forever! 🎉",
				[
					{
						text: "Cancel",
						style: "cancel"
					},
					{ text: "About Pro", onPress: () => {
						this.props.navigation.navigate('More');
					} }
				],
				{ cancelable: false }
			);
		} else {
			//Check attachment type:
			if (attachmentType === "text") {
				const a = {
					id: makeid(6),
					type: "text",
					text: ""
				}

				this.setState({
					attachmentTemp: a
				});
			} else if (attachmentType === "link") {

				const a = {
					id: makeid(6),
					type: "link",
					uri: ""
				}

				this.setState({
					attachmentTemp: a
				});

			} else if (attachmentType === "image") {

				const options = {
					title: '📷',
					mediaType: 'photo',
					storageOptions: {
						skipBackup: true,
						path: 'images',
					},
				};

				ImagePicker.showImagePicker(options, (response) => {

					if (response.didCancel) {
						//User cancelled image picker
					} else if (response.error) {
						alert("Cat.js: " + response.error);
					} else {
						const a = {
							id: makeid(6),
							type: "image",
							uri: response.uri,
							extension: getImageExtension(response.path), //Use file extension of path, because response.uri sometimes don't have it
							isSaved: false
						}
						this.setState({
							attachmentTemp: a
						});
					}
				});
			} else if (attachmentType === "video") {
				// More info on all the options is below in the API Reference... just some common use cases shown here
				const options = {
					title: '🎥',
					mediaType: 'video',
					takePhotoButtonTitle: 'Take Video...',
					storageOptions: {
						skipBackup: true,
						path: 'videos',
					},
				};

				ImagePicker.showImagePicker(options, (response) => {
					
					if (response.didCancel) {
						//User cancelled image picker
					} else if (response.error) {
						alert("Cat.js: ", response.error);
					} else {
						const a = {
							id: makeid(6),
							type: "video",
							uri: response.uri,
							extension: getVideoExtension(response.path), //Use file extension of path, because response.uri sometimes don't have it
							isSaved: false
						}

						this.setState({
							attachmentTemp: a
						});
					}
				});
			} else if (attachmentType === "audio") {
				DocumentPicker.pick({
					type: "audio/*"
				}).then((response) => {
					const a = {
						id: makeid(6),
						type: "audio",
						uri: response.uri,
						extension: getAudioExtension(response.type), //use response.type to get extension
						isSaved: false
					}
					this.setState({
						attachmentTemp: a
					});
				});
			} else if(attachmentType === "tel"){
				const a = {
					id: makeid(6),
					type: "tel",
					tel: ""
				}
				this.setState({
					attachmentTemp: a
				});
			} else if (attachmentType === "pdf") {

				DocumentPicker.pick({
					type: ["application/pdf"],
				}).then((response) => {
					const a = {
						id: makeid(6),
						type: "pdf",
						uri: response.uri,
						isSaved: false
					}
					this.setState({
						attachmentTemp: a
					});
				});
			}
		}
	}

	/* ------------------------------------------------------------- Attachment method */

	/* 
		onChangeText
		-----------------------
		On Change text input (AttachmentText)
	*/
	onChangeText = (text, index) => {

		const a = {...this.state.attachmentTemp}; //copy attachment obj

		a.text = text;

		this.setState({
			attachmentTemp: a
		});
	}

	/* 
		onPressLink
		-----------------------
		Press of a link (AttachmentLink)
	*/
	onPressLink = () => {

		let uri = this.state.attachmentTemp.uri;

		//Add http:// if needed
		if (!/^https?:\/\//i.test(uri)) {
			uri = 'http://' + uri;
		}

		Linking.canOpenURL(uri).then(supported => {
			if (!supported) {
				alert('Cat.js: can\'t handle url: ' + uri);
			} else {
				return Linking.openURL(uri);
			}
		}).catch(err => alert('Cat.js:' + err));
	}

	/* 
		onChangeLink
		-----------------------
		On change text link (AttachmentLink)
	*/
	onChangeLink = (text) => {

		const a = {...this.state.attachmentTemp}; //Use slice to create a copy

		a.uri = text;

		this.setState({
			attachmentTemp: a
		});
	}

	/* 
		onChangeNumber
		-----------------------
		On change tel (AttachmentContact)
	*/
	onChangeNumber = (text) => {
		const a = {...this.state.attachmentTemp}; //Use slice to create a copy

		a.tel = text;

		this.setState({
			attachmentTemp: a
		});
	}

	/* 
		onPressTel
		-----------------------
		On press tel button (AttachmentContact)
	*/
	onPressTel = () => {
		let tel = this.state.attachmentTemp.tel;

		var prefix = 'tel:';

		tel = prefix + tel;

		Linking.canOpenURL(tel).then(supported => {
			if (!supported) {
				alert('Cat.js: can\'t handle url: ' + tel);
			} else {
				return Linking.openURL(tel);
			}
		}).catch(err => alert('Cat.js: an error occurred', err));
	}
	
	

	/* ------------------------------------------------------------------- render */

	render(){
		return(
			<CatScreen

				mode={this.state.mode} //view or edit

				//Catcode props
				name={this.state.name}
				timestamp={this.state.timestamp}
				attachment={this.state.attachmentTemp}

				//Cat methods
				onChangeCatName={this.onChangeCatName}
				onAddAttachment={this.onAddAttachment}
				onPressSave={this.onPressSave}
				onPressEdit={this.onPressEdit}
				onPressCancel={this.onPressCancel}
				onPressShare={this.onPressShare}
				onPressRemove={this.onPressRemove}

				//Attachments methods
				onChangeText={this.onChangeText}
				onChangeLink={this.onChangeLink}
				onChangeNumber={this.onChangeNumber} //only for tel
				onPressLink={this.onPressLink} //only for link
				onPressTel={this.onPressTel} //only for tel
				
				//Others
				sdpath={this.state.sdpath}
				saveWaiting={this.state.saveWaiting}
				proMode={this.props.proMode}/>
		)
	}

}

const mapStateToProps = state => {
    return {
        proMode: state.proMode
    };
}

//Use connect to connect REDUX and REACT
export default connect(mapStateToProps)(Cat);




/* Utility functions */

function makeid(length) {
	 var result           = '';
	 var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	 var charactersLength = characters.length;
	 for ( var i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
	 }
	 return result;
}

function capFirst(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
}

function generateName(){
	const name1 = ["abandoned","able","absolute","adorable","adventurous","academic","acceptable","acclaimed","accomplished","accurate","aching","acidic","acrobatic","active","actual","adept","admirable","admired","adolescent","adorable","adored","advanced","afraid","affectionate","aged","aggravating","aggressive","agile","agitated","agonizing","agreeable","ajar","alarmed","alarming","alert","alienated","alive","all","altruistic","amazing","ambitious","ample","amused","amusing","anchored","ancient","angelic","angry","anguished","animated","annual","another","antique","anxious","any","apprehensive","appropriate","apt","arctic","arid","aromatic","artistic","ashamed","assured","astonishing","athletic","attached","attentive","attractive","austere","authentic","authorized","automatic","avaricious","average","aware","awesome","awful","awkward","babyish","bad","back","baggy","bare","barren","basic","beautiful","belated","beloved","beneficial","better","best","bewitched","big","big-hearted","biodegradable","bite-sized","bitter","black","black-and-white","bland","blank","blaring","bleak","blind","blissful","blond","blue","blushing","bogus","boiling","bold","bony","boring","bossy","both","bouncy","bountiful","bowed","brave","breakable","brief","bright","brilliant","brisk","broken","bronze","brown","bruised","bubbly","bulky","bumpy","buoyant","burdensome","burly","bustling","busy","buttery","buzzing","calculating","calm","candid","canine","capital","carefree","careful","careless","caring","cautious","cavernous","celebrated","charming","cheap","cheerful","cheery","chief","chilly","chubby","circular","classic","clean","clear","clear-cut","clever","close","closed","cloudy","clueless","clumsy","cluttered","coarse","cold","colorful","colorless","colossal","comfortable","common","compassionate","competent","complete","complex","complicated","composed","concerned","concrete","confused","conscious","considerate","constant","content","conventional","cooked","cool","cooperative","coordinated","corny","corrupt","costly","courageous","courteous","crafty","crazy","creamy","creative","creepy","criminal","crisp","critical","crooked","crowded","cruel","crushing","cuddly","cultivated","cultured","cumbersome","curly","curvy","cute","cylindrical","damaged","damp","dangerous","dapper","daring","darling","dark","dazzling","dead","deadly","deafening","dear","dearest","decent","decimal","decisive","deep","defenseless","defensive","defiant","deficient","definite","definitive","delayed","delectable","delicious","delightful","delirious","demanding","dense","dental","dependable","dependent","descriptive","deserted","detailed","determined","devoted","different","difficult","digital","diligent","dim","dimpled","dimwitted","direct","disastrous","discrete","disfigured","disgusting","disloyal","dismal","distant","downright","dreary","dirty","disguised","dishonest","dismal","distant","distinct","distorted","dizzy","dopey","doting","double","downright","drab","drafty","dramatic","dreary","droopy","dry","dual","dull","dutiful","each","eager","earnest","early","easy","easy-going","ecstatic","edible","educated","elaborate","elastic","elated","elderly","electric","elegant","elementary","elliptical","embarrassed","embellished","eminent","emotional","empty","enchanted","enchanting","energetic","enlightened","enormous","enraged","entire","envious","equal","equatorial","essential","esteemed","ethical","euphoric","even","evergreen","everlasting","every","evil","exalted","excellent","exemplary","exhausted","excitable","excited","exciting","exotic","expensive","experienced","expert","extraneous","extroverted","extra-large","extra-small","fabulous","failing","faint","fair","faithful","fake","false","familiar","famous","fancy","fantastic","far","faraway","far-flung","far-off","fast","fat","fatal","fatherly","favorable","favorite","fearful","fearless","feisty","feline","female","feminine","few","fickle","filthy","fine","finished","firm","first","firsthand","fitting","fixed","flaky","flamboyant","flashy","flat","flawed","flawless","flickering","flimsy","flippant","flowery","fluffy","fluid","flustered","focused","fond","foolhardy","foolish","forceful","forked","formal","forsaken","forthright","fortunate","fragrant","frail","frank","frayed","free","French","fresh","frequent","friendly","frightened","frightening","frigid","frilly","frizzy","frivolous","front","frosty","frozen","frugal","fruitful","full","fumbling","functional","funny","fussy","fuzzy","gargantuan","gaseous","general","generous","gentle","genuine","giant","giddy","gigantic","gifted","giving","glamorous","glaring","glass","gleaming","gleeful","glistening","glittering","gloomy","glorious","glossy","glum","golden","good","good-natured","gorgeous","graceful","gracious","grand","grandiose","granular","grateful","grave","gray","great","greedy","green","gregarious","grim","grimy","gripping","grizzled","gross","grotesque","grouchy","grounded","growing","growling","grown","grubby","gruesome","grumpy","guilty","gullible","gummy","hairy","half","handmade","handsome","handy","happy","happy-go-lucky","hard","hard-to-find","harmful","harmless","harmonious","harsh","hasty","hateful","haunting","healthy","heartfelt","hearty","heavenly","heavy","hefty","helpful","helpless","hidden","hideous","high","high-level","hilarious","hoarse","hollow","homely","honest","honorable","honored","hopeful","horrible","hospitable","hot","huge","humble","humiliating","humming","humongous","hungry","hurtful","husky","icky","icy","ideal","idealistic","identical","idle","idiotic","idolized","ignorant","ill","illegal","ill-fated","ill-informed","illiterate","illustrious","imaginary","imaginative","immaculate","immaterial","immediate","immense","impassioned","impeccable","impartial","imperfect","imperturbable","impish","impolite","important","impossible","impractical","impressionable","impressive","improbable","impure","inborn","incomparable","incompatible","incomplete","inconsequential","incredible","indelible","inexperienced","indolent","infamous","infantile","infatuated","inferior","infinite","informal","innocent","insecure","insidious","insignificant","insistent","instructive","insubstantial","intelligent","intent","intentional","interesting","internal","international","intrepid","ironclad","irresponsible","irritating","itchy","jaded","jagged","jam-packed","jaunty","jealous","jittery","joint","jolly","jovial","joyful","joyous","jubilant","judicious","juicy","jumbo","junior","jumpy","juvenile","kaleidoscopic","keen","key","kind","kindhearted","kindly","klutzy","knobby","knotty","knowledgeable","knowing","known","kooky","kosher","lame","lanky","large","last","lasting","late","lavish","lawful","lazy","leading","lean","leafy","left","legal","legitimate","light","lighthearted","likable","likely","limited","limp","limping","linear","lined","liquid","little","live","lively","livid","loathsome","lone","lonely","long","long-term","loose","lopsided","lost","loud","lovable","lovely","loving","low","loyal","lucky","lumbering","luminous","lumpy","lustrous","luxurious","mad","made-up","magnificent","majestic","major","male","mammoth","married","marvelous","masculine","massive","mature","meager","mealy","mean","measly","meaty","medical","mediocre","medium","meek","mellow","melodic","memorable","menacing","merry","messy","metallic","mild","milky","mindless","miniature","minor","minty","miserable","miserly","misguided","misty","mixed","modern","modest","moist","monstrous","monthly","monumental","moral","mortified","motherly","motionless","mountainous","muddy","muffled","multicolored","mundane","murky","mushy","musty","muted","mysterious","naive","narrow","nasty","natural","naughty","nautical","near","neat","necessary","needy","negative","neglected","negligible","neighboring","nervous","new","next","nice","nifty","nimble","nippy","nocturnal","noisy","nonstop","normal","notable","noted","noteworthy","novel","noxious","numb","nutritious","nutty","obedient","obese","oblong","oily","oblong","obvious","occasional","odd","oddball","offbeat","offensive","official","old","old-fashioned","only","open","optimal","optimistic","opulent","orange","orderly","organic","ornate","ornery","ordinary","original","other","our","outlying","outgoing","outlandish","outrageous","outstanding","oval","overcooked","overdue","overjoyed","overlooked","palatable","pale","paltry","parallel","parched","partial","passionate","past","pastel","peaceful","peppery","perfect","perfumed","periodic","perky","personal","pertinent","pesky","pessimistic","petty","phony","physical","piercing","pink","pitiful","plain","plaintive","plastic","playful","pleasant","pleased","pleasing","plump","plush","polished","polite","political","pointed","pointless","poised","poor","popular","portly","posh","positive","possible","potable","powerful","powerless","practical","precious","present","prestigious","pretty","precious","previous","pricey","prickly","primary","prime","pristine","private","prize","probable","productive","profitable","profuse","proper","proud","prudent","punctual","pungent","puny","pure","purple","pushy","putrid","puzzled","puzzling","quaint","qualified","quarrelsome","quarterly","queasy","querulous","questionable","quick","quick-witted","quiet","quintessential","quirky","quixotic","quizzical","radiant","ragged","rapid","rare","rash","raw","recent","reckless","rectangular","ready","real","realistic","reasonable","red","reflecting","regal","regular","reliable","relieved","remarkable","remorseful","remote","repentant","required","respectful","responsible","repulsive","revolving","rewarding","rich","rigid","right","ringed","ripe","roasted","robust","rosy","rotating","rotten","rough","round","rowdy","royal","rubbery","rundown","ruddy","rude","runny","rural","rusty","sad","safe","salty","same","sandy","sane","sarcastic","sardonic","satisfied","scaly","scarce","scared","scary","scented","scholarly","scientific","scornful","scratchy","scrawny","second","secondary","second-hand","secret","self-assured","self-reliant","selfish","sentimental","separate","serene","serious","serpentine","several","severe","shabby","shadowy","shady","shallow","shameful","shameless","sharp","shimmering","shiny","shocked","shocking","shoddy","short","short-term","showy","shrill","shy","sick","silent","silky","silly","silver","similar","simple","simplistic","sinful","single","sizzling","skeletal","skinny","sleepy","slight","slim","slimy","slippery","slow","slushy","small","smart","smoggy","smooth","smug","snappy","snarling","sneaky","sniveling","snoopy","sociable","soft","soggy","solid","somber","some","spherical","sophisticated","sore","sorrowful","soulful","soupy","sour","Spanish","sparkling","sparse","specific","spectacular","speedy","spicy","spiffy","spirited","spiteful","splendid","spotless","spotted","spry","square","squeaky","squiggly","stable","staid","stained","stale","standard","starchy","stark","starry","steep","sticky","stiff","stimulating","stingy","stormy","straight","strange","steel","strict","strident","striking","striped","strong","studious","stunning","stupendous","stupid","sturdy","stylish","subdued","submissive","substantial","subtle","suburban","sudden","sugary","sunny","super","superb","superficial","superior","supportive","sure-footed","surprised","suspicious","svelte","sweaty","sweet","sweltering","swift","sympathetic","tall","talkative","tame","tan","tangible","tart","tasty","tattered","taut","tedious","teeming","tempting","tender","tense","tepid","terrible","terrific","testy","thankful","that","these","thick","thin","third","thirsty","this","thorough","thorny","those","thoughtful","threadbare","thrifty","thunderous","tidy","tight","timely","tinted","tiny","tired","torn","total","tough","traumatic","treasured","tremendous","tragic","trained","tremendous","triangular","tricky","trifling","trim","trivial","troubled","true","trusting","trustworthy","trusty","truthful","tubby","turbulent","twin","ugly","ultimate","unacceptable","unaware","uncomfortable","uncommon","unconscious","understated","unequaled","uneven","unfinished","unfit","unfolded","unfortunate","unhappy","unhealthy","uniform","unimportant","unique","united","unkempt","unknown","unlawful","unlined","unlucky","unnatural","unpleasant","unrealistic","unripe","unruly","unselfish","unsightly","unsteady","unsung","untidy","untimely","untried","untrue","unused","unusual","unwelcome","unwieldy","unwilling","unwitting","unwritten","upbeat","upright","upset","urban","usable","used","useful","useless","utilized","utter","vacant","vague","vain","valid","valuable","vapid","variable","vast","velvety","venerated","vengeful","verifiable","vibrant","vicious","victorious","vigilant","vigorous","villainous","violet","violent","virtual","virtuous","visible","vital","vivacious","vivid","voluminous","wan","warlike","warm","warmhearted","warped","wary","wasteful","watchful","waterlogged","watery","wavy","wealthy","weak","weary","webbed","wee","weekly","weepy","weighty","weird","welcome","well-documented","well-groomed","well-informed","well-lit","well-made","well-off","well-to-do","well-worn","wet","which","whimsical","whirlwind","whispered","white","whole","whopping","wicked","wide","wide-eyed","wiggly","wild","willing","wilted","winding","windy","winged","wiry","wise","witty","wobbly","woeful","wonderful","wooden","woozy","wordy","worldly","worn","worried","worrisome","worse","worst","worthless","worthwhile","worthy","wrathful","wretched","writhing","wrong","wry","yawning","yearly","yellow","yellowish","young","youthful","yummy","zany","zealous","zesty","zigzag","rocky"];
	const name2 = ["cat", "feline", "tabby", "mouser", "puss"];
	const name = capFirst(name1[getRandomInt(0, name1.length)]) + capFirst(name2[getRandomInt(0, name2.length)]);
	return name;
}

function getImageExtension(path){
	const extension = path.split('.').pop(); 
	if (extension.length < 5) {
		return extension
	} else {
		return null
	}
}

function getVideoExtension(path){
	const extension = path.split('.').pop(); 
	if (extension.length < 5) {
		return extension
	} else {
		return null
	}
}

function getAudioExtension(type){
	if (type === "audio/aac") {
		return "aac"
	} else if(type === "audio/mpeg"){
		return "mp3"
	}else if(type ==="audio/wav"){
		return "wav"
	} else if(type === "audio/webm"){
		return "webm"
	}
}