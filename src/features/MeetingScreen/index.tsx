import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import useWebRtc from 'src/hooks/useWebRtc';
import ScreenWrapper from 'src/components/ScreenWrapper';
import { styles } from './styles';

const MeetingScreen = () => {
    const {
        localStream,
        remoteStreams,
        startCall,
        endCall,
        isMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo,
        messages,
        sendMessage,
        setLocalStream,
        startScreenShare,
        stopScreenShare,
        isScreenSharing,
        sharingOwner,
        participants,
        RTCView,
    } = useWebRtc();

    useEffect(() => {

        startCall();
    }, [])
    return (
        <ScreenWrapper childrenStyle={styles.container} isBackButton title={'test'}>

            <View style={styles.videoContainer}>
            <RTCView streamURL={localStream?.toURL()} style={{width: 150, height: 200}} />
                <FlatList
                    data={Object.values(remoteStreams)}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => {
                        console.log(item, 'itemitemitemitemitem');

                        return <RTCView streamURL={item?.toURL()} style={styles.video} />
                    }}
                />
            </View>
        </ScreenWrapper>
    )
}

export default MeetingScreen

