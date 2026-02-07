export const JEE_PHYSICS_UNITS = {
  "Units and Measurement": ["1. Physics and Measurement"],
  "Mechanics": [
    "2. Kinematics",
    "3. Laws of Motion",
    "4. Work, Energy and Power",
    "5. Rotational Motion",
    "6. Gravitation",
    "7. Properties of Solids and Liquids",
  ],
  "Thermodynamics and Gases": ["8. Thermodynamics", "9. Kinetic Theory of Gases"],
  "Oscillations and Waves": ["10. Oscillations and Waves"],
  "Electrostatics & Current": ["11. Electrostatics", "12. Current Electricity"],
  "Magnetism and EMI": [
    "13. Magnetic Effects of Current and Magnetism",
    "14. Electromagnetic Induction and Alternating Currents",
    "15. Electromagnetic Waves",
  ],
  "Optics": ["16. Optics"],
  "Modern Physics": [
    "17. Dual Nature of Matter and Radiation",
    "18. Atoms and Nuclei",
  ],
  "Electronics and Communication": [
    "19. Electronic Devices",
    "20. Communication Systems",
  ],
};

export const JEE_PHYSICAL_CHEMISTRY_UNITS = {
    "Basic Concepts": ["1. Mole Concept"],
    "States of Matter & Structure": ["2. States of Matter", "3. Atomic Structure"],
    "Bonding & Thermodynamics": ["4. Chemical Bonding and Molecular Structure", "5. Chemical Thermodynamics"],
    "Solutions & Equilibrium": ["6. Solutions", "7. Chemical Equilibrium", "8. Ionic Equilibrium"],
    "Electrochemistry & Kinetics": ["9. Redox Reactions and Electrochemistry", "10. Chemical Kinetics"],
    "Surface Chemistry": ["11. Surface Chemistry"],
};

export const JEE_ORGANIC_CHEMISTRY_UNITS = {
    "Basic Principles": ["1. Purification and Characterisation of Organic Compounds", "2. Some Basic Principles of Organic Chemistry"],
    "Hydrocarbons": ["3. Hydrocarbons"],
    "Compounds with Functional Groups": [
        "4. Organic Compounds Containing Halogens",
        "5. Organic Compounds Containing Oxygen",
        "6. Organic Compounds Containing Nitrogen",
    ],
    "Applied Chemistry": [
        "7. Polymers",
        "8. Biomolecules",
        "9. Chemistry in Everyday Life",
    ],
};

export const JEE_INORGANIC_CHEMISTRY_UNITS = {
    "Classification and Principles": ["1. Classification of Elements and Periodicity in Properties", "2. General Principles and Processes of Isolation of Metals"],
    "Block Elements": [
        "3. Hydrogen",
        "4. s-Block Elements (Alkali and Alkaline Earth Metals)",
        "5. p-Block Elements",
        "6. d- and f-Block Elements",
    ],
    "Coordination and Environmental": [
        "7. Co-ordination Compounds",
        "8. Environmental Chemistry",
    ],
    "Practical Chemistry": ["9. Principles Related to Practical Chemistry"],
};

export const JEE_MATHEMATICS_UNITS = {
  "Algebra": [
    "1. Sets, Relations, and Functions",
    "2. Complex Numbers and Quadratic Equations",
    "3. Matrices and Determinants",
    "4. Permutations and Combinations",
    "5. Binomial Theorem",
    "6. Sequence and Series",
  ],
  "Calculus": [
    "7. Limit, Continuity and Differentiability",
    "8. Integral Calculus",
    "9. Differential Equations",
  ],
  "Coordinate Geometry": ["10. Co-ordinate Geometry", "11. Three Dimensional Geometry"],
  "Vectors and Trigonometry": [
    "12. Vector Algebra",
    "14. Trigonometry",
  ],
  "Statistics and Reasoning": [
    "13. Statistics and Probability",
    "15. Mathematical Reasoning",
  ],
};

export const ALL_JEE_SUBJECTS_WITH_UNITS = {
  physics: JEE_PHYSICS_UNITS,
  "physical-chemistry": JEE_PHYSICAL_CHEMISTRY_UNITS,
  "organic-chemistry": JEE_ORGANIC_CHEMISTRY_UNITS,
  "inorganic-chemistry": JEE_INORGANIC_CHEMISTRY_UNITS,
  mathematics: JEE_MATHEMATICS_UNITS,
};

// Derived flat lists for backward compatibility
export const PHYSICS_CHAPTERS = Object.values(JEE_PHYSICS_UNITS).flat();
export const JEE_PHYSICAL_CHEMISTRY_CHAPTERS = Object.values(JEE_PHYSICAL_CHEMISTRY_UNITS).flat();
export const JEE_ORGANIC_CHEMISTRY_CHAPTERS = Object.values(JEE_ORGANIC_CHEMISTRY_UNITS).flat();
export const JEE_INORGANIC_CHEMISTRY_CHAPTERS = Object.values(JEE_INORGANIC_CHEMISTRY_UNITS).flat();
export const MATHEMATICS_CHAPTERS = Object.values(JEE_MATHEMATICS_UNITS).flat();

export const ALL_JEE_SUBJECTS: Record<string, string[]> = {
  physics: PHYSICS_CHAPTERS,
  "physical-chemistry": JEE_PHYSICAL_CHEMISTRY_CHAPTERS,
  "organic-chemistry": JEE_ORGANIC_CHEMISTRY_CHAPTERS,
  "inorganic-chemistry": JEE_INORGANIC_CHEMISTRY_CHAPTERS,
  mathematics: MATHEMATICS_CHAPTERS,
};
