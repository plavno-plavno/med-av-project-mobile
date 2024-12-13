import { StyleSheet, Text, View } from "react-native"
import React from "react"
import { Calendar } from "react-native-big-calendar"
import { styles } from "./styles"
import ScreenWrapper from "src/components/ScreenWrapper"

const CalendarScreen = () => {
  const events = [
    {
      title: "Meeting",
      start: new Date(2024, 11, 12, 16, 0),
      end: new Date(2024, 11, 12, 17, 30),
    },
    {
      title: "Coffee break",
      start: new Date(2024, 11, 12, 14, 0),
      end: new Date(2024, 11, 12, 15, 0),
    },
  ]
  const today = new Date()
  return (
    <View style={styles.container}>
      <Calendar
        events={events}
        height={600}
        mode={"day"}
        onPressEvent={() => console.log("event")}
        minHour={8}
        // headerContentStyle={{ backgroundColor: "gray" }}
        // dayHeaderStyle={{ backgroundColor: "green" }}
        // dayHeaderHighlightColor={"red"}
        date={today}
        ampm={true}
        weekStartsOn={1}
        renderHeader={() => {
          return (
            <View
              style={{
                backgroundColor: "black",
                height: 50,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>HEADER</Text>
            </View>
          )
        }}
        // renderCustomDateForMonth={() => {
        //   return (
        //     <View
        //       style={{
        //         backgroundColor: "black",
        //         height: 50,
        //         justifyContent: "center",
        //         alignItems: "center",
        //       }}
        //     >
        //       <Text style={{ color: "white" }}>HEADER</Text>
        //     </View>
        //   )
        // }}
        // hourComponent={() => {
        //   return (
        //     <View
        //       style={{
        //         backgroundColor: "black",
        //         height: 50,
        //         justifyContent: "center",
        //         alignItems: "center",
        //       }}
        //     >
        //       <Text style={{ color: "white" }}>1 AM</Text>
        //     </View>
        //   )
        // }}
        // scheduleMonthSeparatorStyle={{ color: "black" }}
        activeDate={new Date()}
        hourStyle={styles.hourStyle}
        showAdjacentMonths
      />
    </View>
  )
}

export default CalendarScreen
