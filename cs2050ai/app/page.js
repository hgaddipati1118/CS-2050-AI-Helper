'use client'

import { useState } from 'react';
import axios from 'axios';
import pdfToText from "react-pdftotext";
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

export default function Home() {
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [categories, setCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [splitText, setSplitText] = useState([]);
  const [tags, setTags] = useState([]);
  const [question, setQuestion] = useState('');
  const [pastQuestions, setPastQuestions] = useState([]);

  function extractText(event) {
    const file = event.target.files[0];
    setFile(file);
    setIsLoading(true);
    pdfToText(file)
      .then((text) => {
        setPdfText(text);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to extract text from pdf");
        setIsLoading(false);
      });
  }

  const generateCategories = async () => {
    if (!pdfText) {
      alert('Please upload a PDF first.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/get-categories', { pdfText });
      setCategories(response.data.categories);
      setShowCategories(true);
    } catch (error) {
      console.error('Error generating categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomCategoryChange = (event) => {
    setCustomCategory(event.target.value);
  };

  const addCustomCategory = () => {
    if (customCategory.trim() !== '') {
      setCategories([...categories, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const removeCategory = (indexToRemove) => {
    setCategories(categories.filter((_, index) => index !== indexToRemove));
  };

  const splitTextHandler = async () => {
    if (!pdfText) {
      alert('Please upload a PDF first.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/split-text', { pdfText });
      setSplitText(response.data.splitText);
    } catch (error) {
      console.error('Error splitting text:', error);
      setSplitText([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTags = async () => {
    if (!pdfText) {
      alert('Please upload a PDF first.');
      return;
    }
    if (!splitText.length > 0) {
      alert('Please split the text first.');
      return;
    }
    setIsLoading(true);
    let temp_tags = [];
    for(let i = 0; i < splitText.length; i++) {
      try{
        let section = splitText[i];
        const response = await axios.post('/api/generate-tags', { section, categories });
        temp_tags.push(response.data.tags);
      } catch (error) {
        console.error('Error generating tags:', error);
        temp_tags.push([]);
      }
    }
    for(let i = 0; i < temp_tags.length; i++) {
      if(temp_tags[i].length < 1) {
        try{
          let section = splitText[i];
          const response = await axios.post('/api/generate-tags', { section, categories });
          temp_tags[i] = response.data.tags;
        } catch (error) {
          console.error('Error generating tags:', error);
        }
      }
    }
    setTags(temp_tags);
    
    setIsLoading(false);

  };

  const generateQuestion = async () => {
    if (!pdfText) {
      alert('Please upload a PDF first.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/generate-question', { splitText, tags, categories, pastQuestions });
      setPastQuestions([...pastQuestions, response.data.answer]);
      setQuestion(response.data.answer);
    } catch (error) {
      console.error('Error generating question:', error);
      setQuestion('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">PDF Analyzer</h1>
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Upload PDF:</label>
          <input type="file" accept=".pdf" onChange={extractText} className="w-full" />
        </div>
        {file && (
          <div className="space-x-4">
            <button
              onClick={generateCategories}
              className="bg-blue-500 text-white p-2 rounded"
              disabled={isLoading}
            >
              Generate Categories
            </button>
            <button
              onClick={splitTextHandler}
              className="bg-green-500 text-white p-2 rounded"
              disabled={isLoading}
            >
              Split Text
            </button>
            <button
              onClick={generateTags}
              className="bg-purple-500 text-white p-2 rounded"
              disabled={isLoading}
            >
              Generate Tags
            </button>
            <button
              onClick={generateQuestion}
              className="bg-yellow-500 text-white p-2 rounded"
              disabled={isLoading}
            >
              Generate Question
            </button>
          </div>
        )}
        {isLoading && <p>Loading...</p>}
        {showCategories && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-2">Generated Categories:</h2>
              <ul className="list-disc pl-5">
                {categories.map((category, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{category}</span>
                    <button
                      onClick={() => removeCategory(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block mb-2">Add Custom Category:</label>
              <div className="flex">
                <input
                  type="text"
                  value={customCategory}
                  onChange={handleCustomCategoryChange}
                  className="flex-grow p-2 border rounded-l"
                  placeholder="Enter a custom category"
                />
                <button
                  onClick={addCustomCategory}
                  className="bg-blue-500 text-white p-2 rounded-r"
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}
        {splitText.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Split Text:</h2>
            <ul className="list-disc pl-5">
              {splitText.map((section, index) => (
                <li key={index}>{section}</li>
              ))}
            </ul>
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Generated Tags:</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {question && (
          <div>
            <h2 className="text-xl font-bold mb-2">Generated Question:</h2>
            <div className="bg-yellow-100 p-4 rounded">
            <Latex>{question}</Latex>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}