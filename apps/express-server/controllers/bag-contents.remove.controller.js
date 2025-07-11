import removeDiscService from '../services/bag-contents.remove.service.js';

const removeDiscController = async (req, res, next, serviceFunction = removeDiscService) => {
  try {
    const { contentId } = req.params;
    const { userId } = req.user;

    const result = await serviceFunction(userId, contentId);

    if (result === null) {
      return res.status(404).json({
        success: false,
        message: 'Disc not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Disc removed from your account successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export default removeDiscController;
