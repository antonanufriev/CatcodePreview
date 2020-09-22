import React, {useState, useRef} from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Text
} from 'react-native';

import AttachmentLayout from './attachment-layout';

//react-native-video-controls: warning useNativeDriver, problems in interaction
//https://github.com/itsnubix/react-native-video-controls/issues/179
import MediaControls, { PLAYER_STATES } from 'react-native-media-controls';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome';

//import VideoPlayer from "react-native-true-sight";

const noop = () => {};

function AttachmentAudioVideo(props) {
	
	const videoPlayer = useRef(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [paused, setPaused] = useState(false);
	const [playerState, setPlayerState] = useState(PLAYER_STATES.PLAYING);


	/* -------------------------------------------- MEDIA CONTROLS methods */

	const onSeek = seek => {
		videoPlayer?.current.seek(seek);
	};

	const onPaused = playerState => {
		setPaused(!paused);
		setPlayerState(playerState);
	};

	const onReplay = () => {
		setPlayerState(PLAYER_STATES.PLAYING);
		videoPlayer?.current.seek(0);

		//This solve partially the replay bug
		setPaused(true);
		setPlayerState(PLAYER_STATES.PAUSED);
	};

	const onProgress = data => {
		// Video Player will continue progress even if the video already ended
		if (!isLoading) {
			setCurrentTime(data.currentTime);
		}
	};

	const onLoad = data => {
		setDuration(data.duration);
		setIsLoading(false);
	};

	const onLoadStart = () => setIsLoading(true);

	const onEnd = () => {
		// Uncomment this line if you choose repeat=false in the video player
		setPlayerState(PLAYER_STATES.ENDED);
	};

	const onSeeking = currentTime => setCurrentTime(currentTime);

	return(
		<AttachmentLayout 
			mode={props.mode}
			onPressRemove={props.onPressRemove}
			onPressShare={props.onPressShare}>

			{(props.type === "audio") ?
				<Icon name="music" style={styles.icon} size={60} color="#009764"/>
			: null}

			<Video
				onEnd={onEnd}
				onLoad={onLoad}
				onLoadStart={onLoadStart}
				onProgress={onProgress}
				paused={paused}
				ref={videoPlayer}
				resizeMode="cover"
				source={{uri: props.filePath}}
				repeat={false}
				/*
				source={{
					 uri:
						"http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
				}}
				*/
				style={styles.video} />

			
			<MediaControls
				isFullScreen={isFullScreen}
				duration={duration}
				isLoading={isLoading}
				mainColor="#00CD88"
				onFullScreen={noop}
				onPaused={onPaused}
				onReplay={onReplay}
				onSeek={onSeek}
				onSeeking={onSeeking}
				playerState={playerState}
				progress={currentTime}
				showOnStart={false}
			/>

		</AttachmentLayout>
	);

}

//var width = Dimensions.get('window').width; //full width
//var height = Dimensions.get('window').height; //full height

const styles = StyleSheet.create({
	video: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	},

	videoControls: {
		flex:1,
		position: 'absolute',
		paddingBottom:50,
		alignItems:'center',
		justifyContent:'center',
		bottom: 0,
		backgroundColor:'#0000004f',
	},
	videoControlsPlay: {
		padding:30
	},
	videoName: {
		color:'white',
		fontFamily:'monospace',
		position: 'absolute',
		 top: 0,
		 padding:10
	},
	closebutton: {
		position:'absolute',
		top:0,
		right:0,
		padding:30
	},
	icon:{
		paddingTop:200,
		flex:1,
		justifyContent:'center',
		alignItems:'center',
		textAlign:'center'
	}
});

export default AttachmentAudioVideo
