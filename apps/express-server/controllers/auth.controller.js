import registerUser from '../services/auth.service.js';

const registerController = async (req, res) => {
  try {
    // Call the service with request body
    const result = await registerUser(req.body);

    // Return success response
    res.status(201).json(result);
  } catch (error) {
    // Handle errors
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default registerController;
