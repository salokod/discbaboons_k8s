// Replace template variables like {{username}} with actual values
const replaceVariables = (content, variables) => {
  let result = content;

  // Replace each {{variable}} with its value
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  });

  return result;
};

// Load and process email template
export const getTemplate = async (templateName, variables = {}) => {
  try {
    const templateModule = await import(`./templates/${templateName}.js`);
    const templateData = templateModule.default;

    return {
      subject: replaceVariables(templateData.subject, variables),
      html: replaceVariables(templateData.html, variables),
    };
  } catch (error) {
    throw new Error(`Template '${templateName}' not found: ${error.message}`);
  }
};

// Export as default for existing imports
export default { getTemplate };
