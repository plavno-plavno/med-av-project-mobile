import { createSlice } from "@reduxjs/toolkit"
import { ISubtitlesState } from "./types"

const initialState: ISubtitlesState = {
  subtitles: "",
}

const subtitlesSlice = createSlice({
  name: "subtitles",
  initialState,
  reducers: {
    setSubtitles: (state, action) => {
      state.subtitles = action.payload
    },
  },
})

export const { setSubtitles } = subtitlesSlice.actions

export default subtitlesSlice.reducer
