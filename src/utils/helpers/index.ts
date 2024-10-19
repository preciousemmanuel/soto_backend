

export const uniqueCode = (): number => {
  const code = Math.floor(1000 + Math.random() * 9000);
  return code;
};


export const processAxiosErrorFromCatch = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
    return
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Request:', error.request);
  } else {
    // Something happened in setting up the request that triggered an error
    console.error('Error:', error.message);
  }
}

export const isObjectEmpty = (obj: object) => {
  return Object.entries(obj).length === 0;
};

export const verificationCode = () => {
  const code = Math.floor(1000 + Math.random() * 9000);
  return code;
};