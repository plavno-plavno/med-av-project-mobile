import React, { useCallback, useRef } from "react"
import {
  Calendar,
  CalendarTouchableOpacityProps,
  ICalendarEventBase,
} from "react-native-big-calendar"
import ScreenWrapper from "src/components/ScreenWrapper"
import WeekDays from "src/components/Calendar/WeekDays"
import colors from "src/assets/colors"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"
import { useAppSelector } from "src/hooks/redux"
import { useGetCalendarEventsQuery } from "src/api/calendarApi/calendarApi"
import { useFocusEffect } from "@react-navigation/native"
import { screenWidth } from "@utils/screenResponsive"
import { styles } from "./styles"
import DetailsEventModal from "src/modals/DetailsEventModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"
import { formatTime } from "@utils/utils"
import ScheduleMeetingModal from "src/modals/ScheduleMeetingModal"
import { Portal } from "react-native-portalize"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import moment from "moment"

const CalendarScreen = () => {
  const { selectedDay } = useAppSelector((state) => state.calendar)
  const sheetDetailsRef = useRef<BottomSheetMethods>(null)
  const sheetScheduleRef = useRef<BottomSheetMethods>(null)
  const [eventId, setEventId] = React.useState(0)

  const {
    data: calendarEventsData,
    refetch: calendarEventsRefetch,
    isLoading: isCalendarEventsLoading,
  } = useGetCalendarEventsQuery()
  const { data: authMeData } = useAuthMeQuery()
  const handleOpenDetailsModal = (eventId: number) => {
    setEventId(eventId)
    sheetDetailsRef.current?.open()
  }

  const handleCloseDetailsModal = () => {
    sheetDetailsRef.current?.close()
  }

  const handleOpenScheduleModal = () => {
    sheetScheduleRef.current?.open()
  }

  const handleCloseScheduleModal = () => {
    sheetScheduleRef.current?.close()
  }
  const handleGoModalBack = () => {
    sheetScheduleRef.current?.close()
    sheetDetailsRef.current?.open()
  }

  const transformedEvents =
    calendarEventsData?.data?.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: moment(event.startDate).add(authMeData?.gmtDelta || 0, 'hours').toDate(),
      end: moment(event.endDate).add(authMeData?.gmtDelta || 0, 'hours').toDate(),
      color: event.color || colors.lightAqua,
      status: event.status,
      participants: event.participants,
    })) || []

  const findParticipantStatusByEmail = (email: string, event: any) => {
    const participant = event.participants.find((p: any) => p.email === email)
    return participant ? participant.status : null
  }

  const renderEvent = <T extends ICalendarEventBase>(
    event: T | any,
    touchableOpacityProps: CalendarTouchableOpacityProps
  ) => {
    const participantStatus = findParticipantStatusByEmail(
      authMeData?.email,
      event
    )

    return (
      <TouchableOpacity
        {...touchableOpacityProps}
        key={event?.id}
        onPress={() => handleOpenDetailsModal(event?.id)}
      >
        <Text
          style={[
            styles.eventText,
            {
              textDecorationLine:
                participantStatus === "decline" ? "line-through" : "none",
              color:
                participantStatus === "accept"
                  ? colors.ghostWhite
                  : participantStatus === "decline"
                  ? colors.placeholder
                  : event.color,
            },
          ]}
        >
          {`${event.title}, ${formatTime(event.start)}– ${formatTime(
            event.end
          )}`}
        </Text>
        <Text
          style={[
            styles.eventText,
            {
              color:
                participantStatus === "accept"
                  ? colors.ghostWhite
                  : participantStatus === "decline"
                  ? colors.placeholder
                  : event.color,
            },
          ]}
        >
          {event.description}
        </Text>
      </TouchableOpacity>
    )
  }

  useFocusEffect(
    useCallback(() => {
      calendarEventsRefetch()
    }, [])
  )

  if (isCalendarEventsLoading) {
    return <ActivityIndicator size={"large"} style={{ top: "50%" }} />
  }
  return (
    <>
      <ScreenWrapper childrenStyle={styles.container} isCalendarScreen>
        <Calendar
          events={transformedEvents}
          height={100}
          mode={"day"}
          onPressEvent={() => console.log("event")}
          ampm
          swipeEnabled={false}
          overlapOffset={screenWidth * 0.005}
          date={new Date(selectedDay)}
          renderEvent={renderEvent}
          renderHeader={() => {
            return <WeekDays />
          }}
          hourStyle={styles.hourStyle}
          eventCellTextColor={colors.ghostWhite}
          eventCellStyle={(event) => {
            const participantStatus = findParticipantStatusByEmail(
              authMeData?.email,
              event
            )
            return [
              styles.cellStyle,
              {
                backgroundColor:
                  participantStatus === "accept" ? event.color : colors.white,
                borderWidth: 1,
                borderColor:
                  participantStatus === "accept"
                    ? event.color
                    : participantStatus === "decline"
                    ? colors.placeholder
                    : event.color,
              },
            ]
          }}
        />
      </ScreenWrapper>
      <Portal>
        <DetailsEventModal
          handleOpenScheduleModal={handleOpenScheduleModal}
          onClose={handleCloseDetailsModal}
          eventId={eventId}
          sheetRef={sheetDetailsRef}
        />
        <ScheduleMeetingModal
          handleGoModalBack={handleGoModalBack}
          onClose={handleCloseScheduleModal}
          sheetRef={sheetScheduleRef}
          eventId={eventId}
          refetch={calendarEventsRefetch}
        />
      </Portal>
    </>
  )
}

export default CalendarScreen
