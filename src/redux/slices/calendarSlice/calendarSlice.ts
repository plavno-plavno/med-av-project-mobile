import { createSlice } from "@reduxjs/toolkit"
import moment from "moment"
import { ICalendarState } from "./types"

const initialState: ICalendarState = {
  currentDate: moment(),
  selectedDay: moment().format("YYYY-MM-DD"),
}

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload
    },
    setSelectedDay: (state, action) => {
      state.selectedDay = action.payload
    },
    changeWeek: (state, action) => {
      const direction = action.payload
      const newDate = state.currentDate
        .clone()
        .add(direction === "next" ? 1 : -1, "week")

      state.currentDate = newDate
    },
  },
})

export const { setCurrentDate, setSelectedDay, changeWeek } =
  calendarSlice.actions

export default calendarSlice.reducer
