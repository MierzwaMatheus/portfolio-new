import { useState, useEffect } from 'react';

interface UseMatrixTextOptions {
  text: string;
  speed?: number;
  chars?: string;
}

export function useMatrixText({ text, speed = 50, chars = '!@#$%^&*()_+-=[]{}|;:,.<>?~' }: UseMatrixTextOptions) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      return;
    }

    let iteration = 0;
    const finalText = text;
    let interval: NodeJS.Timeout;

    const animate = () => {
      setDisplayText(
        finalText
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return finalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= finalText.length) {
        clearInterval(interval);
        setDisplayText(finalText);
      }

      iteration += 1 / 3;
    };

    interval = setInterval(animate, speed);
    animate();

    return () => clearInterval(interval);
  }, [text, speed, chars]);

  return displayText;
}
