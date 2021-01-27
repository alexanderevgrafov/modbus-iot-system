const serverErrorCatch = x => {
  if (!x.ok) {
    throw ('Server error: ' + x.message);
  }
  return x;
}

const serverErrorLog = e => console.log('Server Error:', e);

export {serverErrorCatch, serverErrorLog}
