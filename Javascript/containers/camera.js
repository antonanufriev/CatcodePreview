import React, { PureComponent } from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	PermissionsAndroid,
	Dimensions,
	Alert,
	AppState
} from 'react-native';

import RNFS from 'react-native-fs';
import { RNCamera } from 'react-native-camera';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

//Native modules import
import CatcodeNative from '../../NativeModules/CatcodeNative';

//Redux import
import {connect} from 'react-redux';
import * as actionTypes from '../store/actions';

//Custom components import
import CameraOverlay from '../components/camera/camera-overlay';


//proMode Block const:
const MAXNUMCATCODES = 25;

//Request to write on SD card
const requestWritePermission = async () => {
	try {
		const granted = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
			{
				title: "WRITE_EXTERNAL_STORAGE Permission",
				message:
				"App needs access to your storage " +
				"so you can take awesome pictures.",
				buttonNeutral: "Ask Me Later",
				buttonNegative: "Cancel",
				buttonPositive: "OK"
			}
			);
		if (granted === PermissionsAndroid.RESULTS.GRANTED) {
			//console.log("You can use the WRITE_EXTERNAL_STORAGE");
		} else {
			alert("Camera.js: WRITE_EXTERNAL_STORAGE permission denied");
		}
	} catch (err) {
		alert("Camera.js: " + err);
	}
};



class Camera extends PureComponent {

	constructor(props){
		super(props);
		this.state = {
			takePictureWaiting: false, //true when pressed (avoid double press)
			externalShareFile: null, //not null when app is launched from others app sharing
			orientation: ""
		}
	}

	componentDidMount(){

		//request write persmission runtime
		requestWritePermission();
		
		//check for sharing intent:
		this.handleSharingIntent();

		//Add listener, to update sharing intent
		AppState.addEventListener('change', (status) => {
	   	if (status === 'active') {
	   		this.handleSharingIntent();
	   	}
	  	});
	}

	componentWillUnmount(){
		AppState.removeEventListener('change');
	}

	handleSharingIntent = () => {
		// To get All Recived Urls
	   ReceiveSharingIntent.getReceivedFiles(files => {
	   	if (files.length > 0) {
	   		this.setState({ externalShareFile: files[0] }); 	
	   	}
	   }, 
	   (error) =>{
	      alert("Camera.js: " + error);
	   });
	}

/* ------------------------------------------------------------ camera methods */

	/*
		takePicture
		-------------------
		onPress take a picture
	*/
	takePicture = async () => {

		//var startTime, endTime;
		//startTime = new Date();

		if (this.camera) {

			this.setState({
				takePictureWaiting: true
			});

			const options = {
				pauseAfterCapture:true,
				quality: 0.75,
				base64: false,
				orientation: 'portrait',
				writeExif:false
			};
			
			const data = await this.camera.takePictureAsync(options);

			const path = data.uri;
			const deviceOrientation = data.deviceOrientation;

			//endTime = new Date();
  			//var timeDiff = endTime - startTime; //in ms
  			//console.log(timeDiff);

			CatcodeNative.detectCatcode(path, deviceOrientation, error => {
				console.log("[Camera]: error code: " + error);
			}, (id, num) => {

				if (id) { //catcode is VALID and OLD

					//Check if we are attaching from external share intent
					if (this.state.externalShareFile) {
						Alert.alert(
							"Ops 😿",
							"This catcode is already in use. \n \n Do you want overwrite it?",
							[
								{
									text: "Cancel",
									style: "cancel"
								},
								{ 
									text: "Overwrite", 
									onPress: () => {
										this.saveShareExternalCatcode(id);
									} 
								}
							],
							{ cancelable: false }
						);

					} else {
						//Show the catcode content:
						this.props.navigation.navigate("Cat", {
							mode: "view",
							id: id
						});  
					}
				} else { //catcode is VALID and NEW

					//proMode block:MAX NUM OF CATCODES
					if ((this.props.proMode)||(num < MAXNUMCATCODES)) {

						//Check if we are attaching from external share intent
						if (this.state.externalShareFile) {
							//Save directly the content in the catcode found
							this.saveShareExternalCatcode(null);
						} else {
							//Go to new catcode to edit it
							this.props.navigation.navigate("Cat", {
								mode: "edit",
								id: null
							});  
						}
					} else {
						Alert.alert(
							"Ops 😿",
							"You have reached the limit of catcodes.\n\nContribute to catcode development by offering us a beer 🍺. Unlock all the pro features forever! 🎉",
							[
								{
									text: "Cancel",
									style: "cancel"
								},
								{ 
									text: "About Pro", 
									onPress: () => {
										this.props.navigation.navigate('More');
									} 
								}
							],
							{ cancelable: false }
						);
					}
				}

			});
			
			this.setState({
				takePictureWaiting: false
			});

			this.camera.resumePreview();
			RNFS.unlink(path); // Remove image from camera cache
		}
	};

	/*
		saveShareExternalCatcode
		-------------------
		param: id, if set catcode already exist, so call updateCatcode
	*/
	saveShareExternalCatcode = (id) => {

		let attachment = null;

		if (this.state.externalShareFile.text) {
			//Check for http or https url inside the text
			var index = this.state.externalShareFile.text.indexOf("http");

			if (index > -1) {
				//URL FOUND
				attachment = {
					id: makeid(6),
					type: "link",
					uri: this.state.externalShareFile.text.substring(index)
				}
			} else {
				attachment = {
					id: makeid(6),
					type: "text",
					text: this.state.externalShareFile.text
				}
			}
		} else if (this.state.externalShareFile.weblink){
			attachment = {
				id: makeid(6),
				type: "link",
				uri: this.state.externalShareFile.weblink
			}
		} else if (this.state.externalShareFile.contentUri){

			const extension = this.state.externalShareFile.extension;
			const uri = this.state.externalShareFile.contentUri;

			if ((extension == "jpg")||(extension == "png")) {
				attachment = {
					id: makeid(6),
					type: "image",
					uri: uri,
					isSaved: true,
					extension: extension
				}
			} else if (extension == "mp4"){
				attachment = {
					id: makeid(6),
					type: "video",
					uri: uri,
					extension: extension,
					isSaved: true
				}
			} else if (extension == "mp3"){
				attachment = {
					id: makeid(6),
					type: "audio",
					uri: uri,
					extension: extension,
					isSaved: true
				}
			} else if (extension == "pdf"){
				attachment = {
					id: makeid(6),
					type: "pdf",
					uri: uri,
					isSaved: true
				}
			} else {
				Alert.alert(
					"Ops 😿",
					"Can't attach this content.",
					[
						{text: "ok"}
					],
					{ cancelable: false }
				);
			}
		}

		if (attachment) {

			if (!id) {
				//Directly save the catcode
				CatcodeNative.newCatcode(generateName(), JSON.stringify(attachment), error => {
					alert("Camera.js: " + error);
					this.setState({
						externalShareFile: null
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
						externalShareFile: null
					});
				});
			} else {
				CatcodeNative.updateCatcode(id, "", JSON.stringify(attachment), error => {            
					alert("Camera.js: " + error);
					this.setState({
						externalShareFile: null
					});
				}, (success) => {
					Alert.alert(
						"Great 🐱",
						"Your catcode has been successfully updated",
						[{ text: "OK"}],
						{ cancelable: true }
					);
					this.setState({
						externalShareFile: null
					});
				});
			}
			
		}
	}

	onPressCancel = () => {
		// Clear Intents
    	ReceiveSharingIntent.clearReceivedFiles();
		if (this.state.externalShareFile) {
			this.setState({
				externalShareFile: null
			});
		}
	}

	onPressTips = () => {
		Alert.alert(
			"Some tips.",
			"👓 Make sure the code is in focus \n \n📐Make sure the code is inside the silhouette and aligned with it.\n \n💡Make sure the code is lit enough",
			[{ text: "OK"}],
			{ cancelable: true }
		);
	}


	/* ------------------------------------------------------------ render */
	render() {

		//Center the focus in the center
		const autoFocusPointOfInterest = {
			x: 0.5,
			y: 0.5,
		}

		return(
			<View>

				<RNCamera
					ref={ref => {
						this.camera = ref;
					}}
					
					//autoFocus={RNCamera.Constants.AutoFocus.off}
					autoFocusPointOfInterest={autoFocusPointOfInterest}
					style={styles.preview}
					type={RNCamera.Constants.Type.back}
					flashMode={RNCamera.Constants.FlashMode.off}
					androidCameraPermissionOptions={{
						title: 'Permission to use camera',
						message: 'We need your permission to use your camera',
						buttonPositive: 'Ok',
						buttonNegative: 'Cancel',
					}}
				/>

				<CameraOverlay 
					catPressed={this.takePicture}
					onPressCancel={this.onPressCancel}
					takePictureWaiting={this.state.takePictureWaiting} 
					externalShareFile={this.state.externalShareFile}
					onPressTips={this.onPressTips}
				/>
			</View>
		);
	}

}

const mapStateToProps = state => {
    return {
        proMode: state.proMode
    };
}

//Use connect to connect REDUX and REACT
export default connect(mapStateToProps)(Camera);


const styles = StyleSheet.create({
	preview: {
		position: 'absolute',
		flex: 1,
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height
	}
});


/* ---------------------------------------------- some utility function */

function makeid(length) {
	var result= '';
	var characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength=characters.length;
	for (var i = 0; i < length; i++ ) {
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