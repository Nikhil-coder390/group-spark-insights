
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GDSession, Evaluation, GDSessionWithEvaluations, EvaluationCriteria } from "@/types";

type GDContextType = {
  sessions: GDSession[];
  evaluations: Evaluation[];
  isLoading: boolean;
  createSession: (sessionData: Omit<GDSession, "id" | "createdAt" | "createdBy">) => Promise<GDSession>;
  getSessionById: (id: string) => GDSession | undefined;
  getSessionsForUser: () => {
    participatingSessions: GDSession[];
    evaluatingSessions: GDSession[];
  };
  submitEvaluation: (
    gdSessionId: string,
    studentId: string,
    criteria: EvaluationCriteria
  ) => Promise<Evaluation>;
  getEvaluationsForSession: (sessionId: string) => Evaluation[];
  calculateScores: (sessionId: string, studentId: string) => {
    peerAverage: EvaluationCriteria;
    instructorScores: EvaluationCriteria;
    finalScores: EvaluationCriteria;
  };
};

const GDContext = createContext<GDContextType>({
  sessions: [],
  evaluations: [],
  isLoading: false,
  createSession: async () => ({} as GDSession),
  getSessionById: () => undefined,
  getSessionsForUser: () => ({
    participatingSessions: [],
    evaluatingSessions: [],
  }),
  submitEvaluation: async () => ({} as Evaluation),
  getEvaluationsForSession: () => [],
  calculateScores: () => ({
    peerAverage: {
      articulation: 0,
      relevance: 0,
      leadership: 0,
      nonVerbalCommunication: 0,
      impression: 0,
    },
    instructorScores: {
      articulation: 0,
      relevance: 0,
      leadership: 0,
      nonVerbalCommunication: 0,
      impression: 0,
    },
    finalScores: {
      articulation: 0,
      relevance: 0,
      leadership: 0,
      nonVerbalCommunication: 0,
      impression: 0,
    },
  }),
});

export const useGD = () => useContext(GDContext);

// Mock data for development
const MOCK_SESSIONS: GDSession[] = [
  {
    id: "1",
    topic: "Climate Change Solutions",
    details: "Discussing potential technological solutions to combat climate change",
    groupName: "Tech Innovators",
    groupNumber: "G1",
    date: new Date("2023-11-15"),
    participants: ["CS2001", "CS2002", "CS2003"],
    evaluators: ["CS2004", "CS2005"],
    createdBy: "1", // instructor id
    createdAt: new Date("2023-11-10"),
  },
];

const MOCK_EVALUATIONS: Evaluation[] = [
  {
    id: "1",
    gdSessionId: "1",
    studentId: "2", // Jane Student
    evaluatorId: "1", // John Instructor
    evaluatorRole: "instructor",
    criteria: {
      articulation: 8,
      relevance: 9,
      leadership: 7,
      nonVerbalCommunication: 8,
      impression: 9,
    },
    createdAt: new Date("2023-11-15"),
  },
];

export const GDProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GDSession[]>(MOCK_SESSIONS);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(MOCK_EVALUATIONS);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem("gdSessions");
    const storedEvaluations = localStorage.getItem("gdEvaluations");
    
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }
    
    if (storedEvaluations) {
      setEvaluations(JSON.parse(storedEvaluations));
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("gdSessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("gdEvaluations", JSON.stringify(evaluations));
  }, [evaluations]);

  const createSession = async (
    sessionData: Omit<GDSession, "id" | "createdAt" | "createdBy">
  ): Promise<GDSession> => {
    if (!user) throw new Error("You must be logged in to create a session");
    if (user.role !== "instructor") throw new Error("Only instructors can create sessions");

    const newSession: GDSession = {
      ...sessionData,
      id: Math.random().toString(36).substring(2, 9),
      createdBy: user.id,
      createdAt: new Date(),
    };

    setSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  const getSessionById = (id: string): GDSession | undefined => {
    return sessions.find((session) => session.id === id);
  };

  const getSessionsForUser = () => {
    if (!user) {
      return {
        participatingSessions: [],
        evaluatingSessions: [],
      };
    }

    if (user.role === "instructor") {
      const createdSessions = sessions.filter(
        (session) => session.createdBy === user.id
      );
      
      return {
        participatingSessions: [],
        evaluatingSessions: createdSessions,
      };
    }

    // For students
    const rollNumber = user.rollNumber || "";
    
    const participatingSessions = sessions.filter((session) =>
      session.participants.includes(rollNumber)
    );
    
    const evaluatingSessions = sessions.filter((session) =>
      session.evaluators.includes(rollNumber)
    );

    return {
      participatingSessions,
      evaluatingSessions,
    };
  };

  const submitEvaluation = async (
    gdSessionId: string,
    studentId: string,
    criteria: EvaluationCriteria
  ): Promise<Evaluation> => {
    if (!user) throw new Error("You must be logged in to submit an evaluation");

    const session = getSessionById(gdSessionId);
    if (!session) throw new Error("Session not found");

    // Check if user is allowed to evaluate
    if (
      user.role === "student" &&
      !session.evaluators.includes(user.rollNumber || "")
    ) {
      throw new Error("You are not authorized to evaluate this session");
    }

    // Check if the student being evaluated is a participant
    if (!session.participants.includes(studentId)) {
      throw new Error("The student is not a participant in this session");
    }

    // Check if the user has already evaluated this student for this session
    const existingEvaluation = evaluations.find(
      (e) =>
        e.gdSessionId === gdSessionId &&
        e.studentId === studentId &&
        e.evaluatorId === user.id
    );

    if (existingEvaluation) {
      // Update existing evaluation
      const updatedEvaluation = {
        ...existingEvaluation,
        criteria,
        createdAt: new Date(),
      };

      setEvaluations((prev) =>
        prev.map((e) => (e.id === existingEvaluation.id ? updatedEvaluation : e))
      );

      return updatedEvaluation;
    }

    // Create new evaluation
    const newEvaluation: Evaluation = {
      id: Math.random().toString(36).substring(2, 9),
      gdSessionId,
      studentId,
      evaluatorId: user.id,
      evaluatorRole: user.role,
      criteria,
      createdAt: new Date(),
    };

    setEvaluations((prev) => [...prev, newEvaluation]);
    return newEvaluation;
  };

  const getEvaluationsForSession = (sessionId: string): Evaluation[] => {
    return evaluations.filter((e) => e.gdSessionId === sessionId);
  };

  const calculateScores = (sessionId: string, studentId: string) => {
    const sessionEvaluations = evaluations.filter(
      (e) => e.gdSessionId === sessionId && e.studentId === studentId
    );

    // Default empty criteria
    const emptyCriteria: EvaluationCriteria = {
      articulation: 0,
      relevance: 0,
      leadership: 0,
      nonVerbalCommunication: 0,
      impression: 0,
    };

    // No evaluations
    if (sessionEvaluations.length === 0) {
      return {
        peerAverage: emptyCriteria,
        instructorScores: emptyCriteria,
        finalScores: emptyCriteria,
      };
    }

    // Separate peer and instructor evaluations
    const peerEvaluations = sessionEvaluations.filter(
      (e) => e.evaluatorRole === "student"
    );
    
    const instructorEvaluations = sessionEvaluations.filter(
      (e) => e.evaluatorRole === "instructor"
    );

    // Calculate peer average scores
    const peerAverage = peerEvaluations.length > 0
      ? {
          articulation: peerEvaluations.reduce((sum, e) => sum + e.criteria.articulation, 0) / peerEvaluations.length,
          relevance: peerEvaluations.reduce((sum, e) => sum + e.criteria.relevance, 0) / peerEvaluations.length,
          leadership: peerEvaluations.reduce((sum, e) => sum + e.criteria.leadership, 0) / peerEvaluations.length,
          nonVerbalCommunication: peerEvaluations.reduce((sum, e) => sum + e.criteria.nonVerbalCommunication, 0) / peerEvaluations.length,
          impression: peerEvaluations.reduce((sum, e) => sum + e.criteria.impression, 0) / peerEvaluations.length,
        }
      : emptyCriteria;

    // Get instructor scores (use the first one if multiple)
    const instructorScores = instructorEvaluations.length > 0
      ? instructorEvaluations[0].criteria
      : emptyCriteria;

    // Calculate final scores (average of peer and instructor scores)
    const finalScores = {
      articulation: (peerAverage.articulation + instructorScores.articulation) / 2,
      relevance: (peerAverage.relevance + instructorScores.relevance) / 2,
      leadership: (peerAverage.leadership + instructorScores.leadership) / 2,
      nonVerbalCommunication: (peerAverage.nonVerbalCommunication + instructorScores.nonVerbalCommunication) / 2,
      impression: (peerAverage.impression + instructorScores.impression) / 2,
    };

    return {
      peerAverage,
      instructorScores,
      finalScores,
    };
  };

  return (
    <GDContext.Provider
      value={{
        sessions,
        evaluations,
        isLoading,
        createSession,
        getSessionById,
        getSessionsForUser,
        submitEvaluation,
        getEvaluationsForSession,
        calculateScores,
      }}
    >
      {children}
    </GDContext.Provider>
  );
};
