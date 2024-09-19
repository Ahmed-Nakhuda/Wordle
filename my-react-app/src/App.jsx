import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [randomWord, setRandomWord] = useState('');
  const [inputs, setInputs] = useState({});
  const [classes, setClasses] = useState({});
  const [submissionCount, setSubmissionCount] = useState(0);
  const [winState, setWinState] = useState('');
  const buttonRef = useRef(null);
  
  // Create refs for all 30 input fields
  const inputRefs = useRef([]);
  for (let i = 0; i < 30; i++) {
    inputRefs.current[i] = useRef(null);
  }


  /**
   * Fetch a random five letter word and check if it exists in the
   * dictionary, and if it does make it the random word
   */
  const fetchData = async () => {
    let validWord = false;
    let randomWord = '';

    try {
      // fetch 1000 five letter words
      let response = await axios.get('https://api.datamuse.com/words?sp=?????&max=1000');
      const words = response.data;

      while (!validWord && words.length > 0) {
        // choose a random word
        const randomIndex = Math.floor(Math.random() * words.length);
        randomWord = words[randomIndex].word;

        // check if it exists in the dictionary 
        try {
          const dictionaryResponse = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`);
          if (dictionaryResponse.data && dictionaryResponse.data[0].word === randomWord) {
            validWord = true;
          }
        } catch (error) {
          // remove the random word that is not in the dictionary from the array
          words.splice(randomIndex, 1);
        }
      }

      // set the random word
      if (validWord) {
        console.log(`Valid random word is: ${randomWord}`);
        setRandomWord(randomWord);
      } else {
        console.log('No valid words found in the dictionary.');
      }
    } catch (error) {
      console.error('Error fetching words:', error);
    }
  };


  /**
   * Check if the word the user enters is a real word
   * @param {string} word - the word the user entered
   * @returns - true if the word is found otherwise false 
   */
  const checkWordInDictionary = async (word) => {
    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      return response.data && response.data[0].word === word;
    } catch (error) {
      return false;
    }
  };


  // Fetch the data when the component first mounts 
  useEffect(() => {
    fetchData();
  }, []);


  /* Autofocus the next textbox after entering a letter */
  const handleChange = (event, index) => {
    const name = event.target.name;
    const value = event.target.value;

    // Update the state of the inputs
    setInputs((values) => ({
      ...values, // retain all existing input values in the state
      [name]: value // update or add the new value for the specific input field identified by 'name'
    }
    ));

    // move to the next input if a character is entered
    if (value.length === 1 && index < 29) {
      inputRefs.current[index + 1].current.focus();
    }
  };


  /* Handle game logic */
  const submit = async () => {
    // an object to store the classes for the current row of inputs (green, yellow, gray)
    const newClasses = {};

    // only submit if user enters 5 letters 
    const startIndex = submissionCount * 5;
    const endIndex = startIndex + 5;

    const keys = Object.keys(inputs).slice(startIndex, endIndex);
    if (keys.length !== 5) {
      alert('Please enter a 5 letter word')
      return;
    }

    // only submit if user enters a valid word 
    const userInput = keys.map((key) => inputs[key]).join('');

    const isValidWord = await checkWordInDictionary(userInput);
    if (!isValidWord) {
      alert('The word entered was not found in the dictionary.');
      return;
    }

    // Compare each letter in the user's input with the random word
    keys.forEach((key, index) => {
      const letter = inputs[key];
      if (letter === randomWord[index]) {
        newClasses[key] = 'green';
      } else if (randomWord.includes(letter)) {
        newClasses[key] = 'yellow';
      } else {
        newClasses[key] = 'gray';
      }
    });

    // Update the classes state to reflect the color changes for the current row
    setClasses((prevClasses) => ({ ...prevClasses, ...newClasses }));

    setSubmissionCount((prevCount) => {
      const newCount = prevCount + 1;

      // after submissionCount is updated, focus the first input of the next row
      if (newCount <= 5) {
        const nextInputIndex = newCount * 5;

        // Delay slightly to ensure DOM has updated
        setTimeout(() => {
          inputRefs.current[nextInputIndex]?.current?.focus();
        }, 0);
      }
      return newCount;
    });

    // win condition
    const allGreen = keys.every((key) => newClasses[key] === 'green');
    if (allGreen) {
      setWinState('You Win!');
    }

    // lose condition
    if (submissionCount === 5 && !allGreen) {
      setWinState(`The word was ${randomWord}`);
    }
  };


  /**
  * Allow the user to use their keyboard for certain actions 
  * @param {KeyboardEvent} event - the event triggered by a key press 
  * @param {number} index - the index of the textbox
  */
  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1].current.focus();
    } else if (event.key === 'ArrowRight' && index < 29) {
      event.preventDefault();
      inputRefs.current[index + 1].current.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };


  /**
   * When a key is pressed, this passes the event and the input field's index to the handleKeyDown function. 
   * @param {number} index - the index of the textbox
   */
  const inputProps = (index) => ({
    onKeyDown: (event) => handleKeyDown(event, index)
  });


  /* Resets the game */
  const reset = () => {
    setRandomWord('');
    setInputs({});
    setClasses({});
    setSubmissionCount(0);
    setWinState('');
    fetchData();
  };


  return (
    <>
      <h1>WORDLE</h1>
      <p>{winState}</p>
      {
        // 6 rows of inputs
        Array.from({ length: 6 }, (_, i) => ( 
          // create a div container for each row
          <div key={i} className="input-container">
            {
              // for each row, create another array of 5 elements to represent 5 input fields (columns)
              Array.from({ length: 5 }, (_, j) => (
              <input
                  type="text"
                  maxLength={1}
                  key={`${i * 5 + j + 1}`} // unique key for each input
                  name={`letter${i * 5 + j + 1}`} // unique name for each input
                  value={inputs[`letter${i * 5 + j + 1}`] || ''} // set the value to the corresponding value stored in the input's state
                  className={classes[`letter${i * 5 + j + 1}`] || ''} // set the styling based on the input's state
                  ref={inputRefs.current[i * 5 + j]} // assign a unique ref to each input field
                  onChange={(e) => handleChange(e, i * 5 + j)} // onChange handler function to update the input state
                  disabled={submissionCount === i ? false : true} // disable inputs unless it's the current row to be filled
                  {...inputProps(i * 5 + j)} // apply inputProps with index
                />
              ))
            }
          </div>
        ))
      }
      <div id='button-container'>
        <button onClick={reset}>Reset</button>
        <button ref={buttonRef} onClick={submit}>Submit</button>
      </div>
    </>
  );
}

export default App;


