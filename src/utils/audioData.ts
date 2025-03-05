export const base64ToBytes = (base64String: string) => {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const pcm16BytesToFloat32Array = (
  bytes: string | any[] | Uint8Array,
) => {
  const sampleCount = bytes.length / 2;
  const float32Array = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    let val = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
    if (val & 0x8000) {
      val = val - 0x10000;
    }
    // Normalize from signed 16-bit integer to float range [-1, 1]
    float32Array[i] = val / 32768.0;
  }

  return float32Array;
};

export const base64ToFloat32Array = (base64String: string) => {
  const bytes = base64ToBytes(base64String);
  return pcm16BytesToFloat32Array(bytes);
};

export const float32ArrayToBase64 = (float32Array: Float32Array) => {
  const uint8Array = new Uint8Array(float32Array.buffer);

  let binaryString = "";

  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }

  return btoa(binaryString);
};

export const resampleTo16kHZ = (
  audioData: Float32Array,
  origSampleRate = 44100,
) => {
  const data = new Float32Array(audioData);
  const targetLength = Math.round(data.length * (16000 / origSampleRate));
  const resampledData = new Float32Array(targetLength);
  const springFactor = (data.length - 1) / (targetLength - 1);
  // eslint-disable-next-line prefer-destructuring
  resampledData[0] = data[0];
  resampledData[targetLength - 1] = data[data.length - 1];

  for (let i = 1; i < targetLength - 1; i++) {
    const index = i * springFactor;
    const leftIndex = Math.floor(index);
    const rightIndex = Math.ceil(index);
    const fraction = index - leftIndex;
    resampledData[i] =
      data[leftIndex] + (data[rightIndex] - data[leftIndex]) * fraction;
  }

  return resampledData;
};

export const Float32ConcatAll = (...arrays: any[][]) => {
  // If the user provides an array of arrays, handle that
  if (arrays.length === 1 && Array.isArray(arrays[0])) {
    arrays = arrays[0];
  }

  // Calculate total length
  let totalLength = 0;
  for (let arr of arrays) {
    totalLength += arr.length;
  }

  // Create a new Float32Array with the total length
  let result = new Float32Array(totalLength);

  // Copy each array into the result
  let offset = 0;
  for (let arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
};
