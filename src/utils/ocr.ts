import { AadhaarData } from '../types';
import { EnhancedOCR } from './enhancedOcr';
import { NLPFieldMatcher } from './nlpMatcher';

export const processAadhaarCard = async (imageFile: File): Promise<AadhaarData> => {
  const enhancedOCR = new EnhancedOCR();
  return await enhancedOCR.processAadhaarCard(imageFile);
};