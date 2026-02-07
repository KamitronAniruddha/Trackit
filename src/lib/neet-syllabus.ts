import { ALL_JEE_SUBJECTS_WITH_UNITS, ALL_JEE_SUBJECTS } from "./jee-syllabus";

// Unit-based structure
export const NEET_PHYSICS_UNITS = {
  "Mechanics": [
    "1. Units and Measurements", "2. Motion in a Straight Line", "3. Motion in a Plane", "4. Laws of Motion",
    "5. Work, Energy and Power", "6. System of Particles and Rotational Motion", "7. Gravitation"
  ],
  "Properties of Matter": [
    "8. Mechanical Properties of Solids", "9. Mechanical Properties of Fluids", "10. Thermal Properties of Matter"
  ],
  "Thermodynamics & Kinetic Theory": ["11. Thermodynamics", "12. Kinetic Theory"],
  "Oscillations & Waves": ["13. Oscillations", "14. Waves"],
  "Electrostatics": ["15. Electric Charges and Fields", "16. Electrostatic Potential and Capacitance"],
  "Current Electricity & Magnetism": [
    "17. Current Electricity", "18. Moving Charges and Magnetism", "19. Magnetism and Matter"
  ],
  "EMI, AC & EM Waves": [
    "20. Electromagnetic Induction", "21. Alternating Current", "22. Electromagnetic Waves"
  ],
  "Optics": ["23. Ray Optics and Optical Instruments", "24. Wave Optics"],
  "Modern Physics": ["25. Dual Nature of Radiation and Matter", "26. Atoms", "27. Nuclei"],
  "Electronic Devices": ["28. Semiconductor Electronics"]
};

export const NEET_PHYSICAL_CHEMISTRY_UNITS = {
    "Basic Concepts": ["1. Mole Concept"],
    "Atomic Structure": ["2. Structure of Atom"],
    "Thermodynamics & Equilibrium": ["3. Thermodynamics", "4. Chemical Equilibrium", "5. Ionic Equilibrium"],
    "Redox & Electrochemistry": ["6. Redox Reactions", "7. Electrochemistry"],
    "Kinetics & Solutions": ["8. Chemical Kinetics", "9. Solutions"],
};

export const NEET_ORGANIC_CHEMISTRY_UNITS = {
    "Basic Principles": ["1. Organic Chemistry: Some Basic Principles and Techniques"],
    "Hydrocarbons & Halides": ["2. Hydrocarbons", "3. Haloalkanes and Haloarenes"],
    "Oxygen Containing Compounds": ["4. Alcohols, Phenols and Ethers", "5. Aldehydes, Ketones and Carboxylic Acids"],
    "Nitrogen Containing & Biomolecules": ["6. Amines", "7. Biomolecules"],
    "Applied Chemistry": ["8. Polymers", "9. Chemistry in Everyday Life"],
};

export const NEET_INORGANIC_CHEMISTRY_UNITS = {
    "Periodicity & Bonding": ["1. Classification of Elements and Periodicity in Properties", "2. Chemical Bonding and Molecular Structure"],
    "Block Elements": ["3. Hydrogen", "4. s-Block Elements", "5. p-Block Elements (Group 13 & 14)", "6. p-Block Elements (Group 15, 16, 17, 18)"],
    "d/f-Block & Coordination": ["7. d- and f-Block Elements", "8. Coordination Compounds"],
    "Metallurgy & Environmental": ["9. General Principles and Processes of Isolation of Elements", "10. Environmental Chemistry"],
};

export const NEET_BIOLOGY_UNITS = {
  "Diversity in Living World": ["1. The Living World", "2. Biological Classification", "3. Plant Kingdom", "4. Animal Kingdom"],
  "Structural Organisation": ["5. Morphology of Flowering Plants", "6. Anatomy of Flowering Plants", "7. Structural Organisation in Animals"],
  "Cell Structure and Function": ["8. Cell: The Unit of Life", "9. Biomolecules", "10. Cell Cycle and Cell Division"],
  "Plant Physiology": ["11. Transport in Plants", "12. Mineral Nutrition", "13. Photosynthesis in Higher Plants", "14. Respiration in Plants", "15. Plant Growth and Development"],
  "Human Physiology": ["16. Digestion and Absorption", "17. Breathing and Exchange of Gases", "18. Body Fluids and Circulation", "19. Excretory Products and their Elimination", "20. Locomotion and Movement", "21. Neural Control and Coordination", "22. Chemical Coordination and Integration"],
  "Reproduction": ["23. Reproduction in Organisms", "24. Sexual Reproduction in Flowering Plants", "25. Human Reproduction", "26. Reproductive Health"],
  "Genetics and Evolution": ["27. Principles of Inheritance and Variation", "28. Molecular Basis of Inheritance", "29. Evolution"],
  "Biology and Human Welfare": ["30. Human Health and Disease", "31. Strategies for Enhancement in Food Production", "32. Microbes in Human Welfare"],
  "Biotechnology": ["33. Biotechnology: Principles and Processes", "34. Biotechnology and its Applications"],
  "Ecology and Environment": ["35. Organisms and Populations", "36. Ecosystem", "37. Biodiversity and Conservation", "38. Environmental Issues"],
};

// New export with unit structure
export const ALL_NEET_SUBJECTS_WITH_UNITS = {
  physics: NEET_PHYSICS_UNITS,
  "physical-chemistry": NEET_PHYSICAL_CHEMISTRY_UNITS,
  "organic-chemistry": NEET_ORGANIC_CHEMISTRY_UNITS,
  "inorganic-chemistry": NEET_INORGANIC_CHEMISTRY_UNITS,
  biology: NEET_BIOLOGY_UNITS,
};

// Derived flat lists for backward compatibility
export const PHYSICS_CHAPTERS = Object.values(NEET_PHYSICS_UNITS).flat();
export const PHYSICAL_CHEMISTRY_CHAPTERS = Object.values(NEET_PHYSICAL_CHEMISTRY_UNITS).flat();
export const ORGANIC_CHEMISTRY_CHAPTERS = Object.values(NEET_ORGANIC_CHEMISTRY_UNITS).flat();
export const INORGANIC_CHEMISTRY_CHAPTERS = Object.values(NEET_INORGANIC_CHEMISTRY_UNITS).flat();
export const BIOLOGY_CHAPTERS = Object.values(NEET_BIOLOGY_UNITS).flat();

export const ALL_NEET_SUBJECTS: Record<string, string[]> = {
  physics: PHYSICS_CHAPTERS,
  "physical-chemistry": PHYSICAL_CHEMISTRY_CHAPTERS,
  "organic-chemistry": ORGANIC_CHEMISTRY_CHAPTERS,
  "inorganic-chemistry": INORGANIC_CHEMISTRY_CHAPTERS,
  biology: BIOLOGY_CHAPTERS,
};

// Main export combining both syllabuses
export const ALL_SUBJECTS = {
    'NEET': ALL_NEET_SUBJECTS,
    'JEE': ALL_JEE_SUBJECTS
};

export const ALL_SUBJECTS_WITH_UNITS = {
  'NEET': ALL_NEET_SUBJECTS_WITH_UNITS,
  'JEE': ALL_JEE_SUBJECTS_WITH_UNITS
};
