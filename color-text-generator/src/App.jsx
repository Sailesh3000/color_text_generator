import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Text, 
  Button, 
  Group, 
  Stack 
} from '@mantine/core';

// ANSI Code Mappings from the original implementation
const ANSI_CODES = {
  // Foreground Colors
  '30': { color: '#4f545c', name: 'Dark Gray (33%)' },
  '31': { color: '#dc322f', name: 'Red' },
  '32': { color: '#859900', name: 'Yellowish Green' },
  '33': { color: '#b58900', name: 'Gold' },
  '34': { color: '#268bd2', name: 'Light Blue' },
  '35': { color: '#d33682', name: 'Pink' },
  '36': { color: '#2aa198', name: 'Teal' },
  '37': { color: '#ffffff', name: 'White' },
  
  // Background Colors
  '40': { color: '#002b36', name: 'Blueish Black' },
  '41': { color: '#cb4b16', name: 'Rust Brown' },
  '42': { color: '#586e75', name: 'Gray (40%)' },
  '43': { color: '#657b83', name: 'Gray (45%)' },
  '44': { color: '#839496', name: 'Light Gray (55%)' },
  '45': { color: '#6c71c4', name: 'Blurple' },
  '46': { color: '#93a1a1', name: 'Light Gray (60%)' },
  '47': { color: '#fdf6e3', name: 'Cream White' },

  // Style Codes
  '1': 'Bold',
  '4': 'Underline'
};

const DiscordTextGenerator = () => {
  const [text, setText] = useState('Welcome to Rebane\'s Discord Colored Text Generator!');
  const [styledSegments, setStyledSegments] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const contentEditableRef = useRef(null);

  const sanitizeHTML = (html) => {
    // Remove any potentially dangerous tags, but keep styling
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  };

  const handleStyleApplication = (ansiCode) => {
    const selection = window.getSelection();
    console.log('Selection:', selection.toString()); // Debug log
    
    if (!selection.toString().trim()) {
      console.log('No text selected'); // Debug log
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    // Debug log
    console.log('Applying style:', ansiCode, 'to text:', selectedText);

    // Create a new span with inline styles instead of class
    const span = document.createElement('span');
    
    // Apply color based on ANSI code
    if (ansiCode.startsWith('3')) {  // Foreground color
      span.style.color = ANSI_CODES[ansiCode].color;
    } else if (ansiCode.startsWith('4')) {  // Background color
      span.style.backgroundColor = ANSI_CODES[ansiCode].color;
    } else if (ansiCode === '1') {  // Bold
      span.style.fontWeight = 'bold';
    } else if (ansiCode === '4') {  // Underline
      span.style.textDecoration = 'underline';
    }

    span.textContent = selectedText;

    // Replace the selected text with the styled span
    range.deleteContents();
    range.insertNode(span);

    // Update state
    setStyledSegments(prev => [...prev, { text: selectedText, ansiCode }]);

    // Clear selection after styling
    window.getSelection().removeAllRanges();
  };

  const copyToClipboardWithANSI = () => {
    const textarea = contentEditableRef.current;
  
    const convertToANSI = (node) => {
      let result = '';
      
      Array.from(node.childNodes).forEach(childNode => {
        if (childNode.nodeType === Node.TEXT_NODE) {
          result += childNode.textContent;
        } else if (childNode.nodeType === Node.ELEMENT_NODE) {
          let ansiCodes = [];
          
          // Detect foreground color
          if (childNode.style.color) {
            const colorCode = Object.entries(ANSI_CODES)
              .find(([code, info]) => 
                info.color && info.color.toLowerCase() === childNode.style.color.toLowerCase() && 
                code.startsWith('3')  // Ensure it's a foreground color
              )?.[0];
            
            if (colorCode) ansiCodes.push(colorCode);
          }
          
          // Detect background color
          if (childNode.style.backgroundColor) {
            const bgColorCode = Object.entries(ANSI_CODES)
              .find(([code, info]) => 
                info.color && info.color.toLowerCase() === childNode.style.backgroundColor.toLowerCase() && 
                code.startsWith('4')  // Ensure it's a background color
              )?.[0];
  
            if (bgColorCode) ansiCodes.push(bgColorCode);
          }
  
          // Detect bold and underline styles
          if (childNode.style.fontWeight === 'bold') ansiCodes.push('1');
          if (childNode.style.textDecoration === 'underline') ansiCodes.push('4');
  
          // Apply ANSI codes
          if (ansiCodes.length) {
            result += `\u001b[${ansiCodes.join(';')}m${childNode.textContent}\u001b[0m`;
          } else {
            result += childNode.textContent;
          }
        }
      });
  
      return result;
    };
  
    const ansiText = convertToANSI(textarea);
    const formattedText = `\`\`\`ansi\n${ansiText}\n\`\`\``;
    
    navigator.clipboard.writeText(formattedText).then(() => {
      alert('Copied to clipboard in ANSI format!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleTooltipShow = (ansiCode, event) => {
    const tooltipText = ANSI_CODES[ansiCode]?.name || '';
    setTooltip({
      visible: true,
      text: tooltipText,
      x: event.clientX,
      y: event.clientY - 36
    });
  };

  const handleTooltipHide = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  const renderStyleButtons = (type) => {
    const codes = type === 'fg' 
      ? ['30', '31', '32', '33', '34', '35', '36', '37']
      : ['40', '41', '42', '43', '44', '45', '46', '47'];

    return (
      <Group gap="xs">
        {codes.map(code => (
          <Button
            key={code}
            onClick={() => handleStyleApplication(code)}
            onMouseEnter={(e) => handleTooltipShow(code, e)}
            onMouseLeave={handleTooltipHide}
            style={{
              backgroundColor: ANSI_CODES[code].color,
              minWidth: '32px',
              minHeight: '32px',
              padding: 0
            }}
          />
        ))}
      </Group>
    );
  };

  // Handle initial text and prevent React warning
  useEffect(() => {
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = text;
    }
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#36393F', 
      minHeight: '100vh', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Container size="sm">
        <Stack gap="lg">
          <h1>
            Rebane's <span style={{color: '#5865F2'}}>Discord</span> Colored Text Generator
          </h1>

          <Text size="sm" c="dimmed" mb="md">
            This is a simple app that creates colored Discord messages using the 
            ANSI color codes available on the latest Discord desktop versions.
          </Text>

          <Group>
            <Button 
              onClick={() => {
                setText('Welcome to Rebane\'s Discord Colored Text Generator!');
                setStyledSegments([]);
                if (contentEditableRef.current) {
                  contentEditableRef.current.innerHTML = 'Welcome to Rebane\'s Discord Colored Text Generator!';
                }
              }}
              style={{ backgroundColor: '#4F545C', color: 'white' }}
            >
              Reset All
            </Button>
            <Button 
              onClick={() => handleStyleApplication('1')}
              style={{ backgroundColor: '#4F545C', color: 'white' }}
            >
              Bold
            </Button>
            <Button 
              onClick={() => handleStyleApplication('4')}
              style={{ backgroundColor: '#4F545C', color: 'white' }}
            >
              Line
            </Button>
          </Group>

          <div>
            <Text size="xs" mb="xs">FG Colors</Text>
            {renderStyleButtons('fg')}
          </div>

          <div>
            <Text size="xs" mb="xs">BG Colors</Text>
            {renderStyleButtons('bg')}
          </div>

          <div 
            ref={contentEditableRef}
            contentEditable 
            onInput={(e) => {
              // Sanitize input and update text
              const sanitizedHTML = sanitizeHTML(e.target.innerHTML);
              e.target.innerHTML = sanitizedHTML;
              setText(e.target.innerText);
            }}
            style={{
              width: '100%', 
              minHeight: '200px', 
              backgroundColor: '#2F3136', 
              color: '#B9BBBE',
              border: '1px solid #202225',
              padding: '10px',
              borderRadius: '5px',
              whiteSpace: 'pre-wrap'
            }}
          />

          <Button 
            onClick={copyToClipboardWithANSI}
            style={{ backgroundColor: '#7289DA', color: 'white' }}
          >
            Copy text as Discord formatted
          </Button>

          {tooltip.visible && (
            <div 
              style={{
                position: 'fixed',
                top: tooltip.y,
                left: tooltip.x,
                backgroundColor: '#3BA55D',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '3px',
                zIndex: 1000
              }}
            >
              {tooltip.text}
            </div>
          )}

          <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
            This is an unofficial tool, it is not made or endorsed by Discord.
          </Text>
        </Stack>
      </Container>
    </div>
  );
};

export default DiscordTextGenerator;