import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (data) => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitizedObj = {};
    for (const key in data) {
      sanitizedObj[key] = sanitize(data[key]);
    }
    return sanitizedObj;
  }
  
  return data;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

export default sanitizeMiddleware;
