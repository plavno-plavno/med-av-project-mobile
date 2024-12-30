import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const VideoGrid = ({ streams }) => {
  const gridStyle = streams?.length <= 4 ? styles.gridTwoByTwo : styles.gridThreeByThree;

  return (
    <View style={gridStyle}>
      {streams?.map((stream, index) => (
        <RTCView
          key={index}
          streamURL={stream.toURL()}
          style={styles.video}
          objectFit="cover"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridTwoByTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  gridThreeByThree: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  video: {
    width: '45%', // Adjust for grid layout
    height: 200,
    margin: 5,
    borderRadius: 10,
  },
});

export default VideoGrid;
