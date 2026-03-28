import { createClient } from "./client";

type SupabaseClient = ReturnType<typeof createClient>;

export interface StudentStats {
  totalExams: number;
  averageScore: number;
  studyStreak: number;
  totalTime: number;
}

export interface PerformanceData {
  subject: string;
  score: number;
}

export interface WeakTopic {
  topic: string;
  accuracy: number;
}

export interface RecentExam {
  id: string;
  title: string;
  score: number;
  date: string;
}

export interface ReadinessData {
  score: number;
  weakAreas: string[];
}

export interface StudentStudyOverview {
  availableExams: number;
  availableReviewers: number;
  recommendedFocus: string;
}

export interface SubjectSummary {
  name: string;
  examCount: number;
}

export class DashboardService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient();
  }

  async getStudentStats(studentId: string): Promise<StudentStats> {
    try {
      const { data: attempts, error } = await this.client
        .from("exam_attempts")
        .select("*")
        .eq("student_id", studentId)
        .not("submitted_at", "is", null);

      if (error) throw error;

      const totalExams = attempts?.length || 0;
      const averageScore = attempts?.length
        ? attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length
        : 0;

      const studyStreak = await this.calculateStudyStreak(studentId);
      const totalTime = totalExams * 45;

      return {
        totalExams,
        averageScore: Math.round(averageScore * 100) / 100,
        studyStreak,
        totalTime
      };
    } catch (error) {
      console.error("Error fetching student stats:", error);
      throw error;
    }
  }

  async getPerformanceData(studentId: string): Promise<PerformanceData[]> {
    try {
      const { data, error } = await this.client
        .from("exam_attempts")
        .select("score, mock_exams(subjects(name))")
        .eq("student_id", studentId)
        .not("submitted_at", "is", null);

      if (error) throw error;

      const subjectScores: { [key: string]: number[] } = {};

      data?.forEach((attempt: any) => {
        const subjectName = attempt.mock_exams?.subjects?.name;
        if (subjectName) {
          if (!subjectScores[subjectName]) {
            subjectScores[subjectName] = [];
          }
          subjectScores[subjectName].push(attempt.score);
        }
      });

      return Object.entries(subjectScores).map(([subject, scores]) => ({
        subject,
        score: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100
      }));
    } catch (error) {
      console.error("Error fetching performance data:", error);
      throw error;
    }
  }

  async getWeakTopics(studentId: string): Promise<WeakTopic[]> {
    try {
      const { data: attempts, error: attemptsError } = await this.client
        .from("exam_attempts")
        .select("id")
        .eq("student_id", studentId)
        .not("submitted_at", "is", null);

      if (attemptsError) throw attemptsError;

      if (!attempts || attempts.length === 0) {
        return [];
      }

      const attemptIds = attempts.map((a) => a.id);

      const { data, error } = await this.client
        .from("exam_answers")
        .select("is_correct, exam_questions(topics(name))")
        .in("attempt_id", attemptIds);

      if (error) throw error;

      const topicStats: { [key: string]: { correct: number; total: number } } = {};

      data?.forEach((answer: any) => {
        const topicName = answer.exam_questions?.topics?.name;
        if (topicName) {
          if (!topicStats[topicName]) {
            topicStats[topicName] = { correct: 0, total: 0 };
          }
          topicStats[topicName].total++;
          if (answer.is_correct) {
            topicStats[topicName].correct++;
          }
        }
      });

      return Object.entries(topicStats)
        .map(([topic, stats]) => ({
          topic,
          accuracy: Math.round((stats.correct / stats.total) * 100 * 100) / 100
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 4);
    } catch (error) {
      console.error("Error fetching weak topics:", error);
      throw error;
    }
  }

  async getRecentExams(studentId: string, limit: number = 5): Promise<RecentExam[]> {
    try {
      const { data, error } = await this.client
        .from("exam_attempts")
        .select("id, score, submitted_at, mock_exams(title)")
        .eq("student_id", studentId)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (
        data?.map((exam: any) => ({
          id: exam.id,
          title: exam.mock_exams?.title || "Unknown Exam",
          score: Math.round(exam.score),
          date: new Date(exam.submitted_at).toLocaleDateString()
        })) || []
      );
    } catch (error) {
      console.error("Error fetching recent exams:", error);
      throw error;
    }
  }

  async getReadinessScore(studentId: string): Promise<ReadinessData> {
    try {
      const weakTopics = await this.getWeakTopics(studentId);
      const performanceData = await this.getPerformanceData(studentId);
      const averageScore = performanceData.length > 0
        ? performanceData.reduce((sum, perf) => sum + perf.score, 0) / performanceData.length
        : 0;

      const weakAreas = weakTopics.filter((topic) => topic.accuracy < 70).map((topic) => topic.topic);
      const readinessScore = Math.min(
        100,
        Math.round(averageScore * 0.7 + (100 - weakAreas.length * 10) * 0.3)
      );

      return {
        score: readinessScore,
        weakAreas
      };
    } catch (error) {
      console.error("Error calculating readiness score:", error);
      throw error;
    }
  }

  async getStudyOverview(studentId: string): Promise<StudentStudyOverview> {
    const [availableExamsRes, availableReviewersRes, weakTopics] = await Promise.all([
      this.client.from("mock_exams").select("id", { count: "exact", head: true }),
      this.client.from("review_materials").select("id", { count: "exact", head: true }),
      this.getWeakTopics(studentId)
    ]);

    return {
      availableExams: availableExamsRes.count ?? 0,
      availableReviewers: availableReviewersRes.count ?? 0,
      recommendedFocus: weakTopics[0]?.topic ?? "Start with a full mock exam"
    };
  }

  async getAvailableSubjects(): Promise<SubjectSummary[]> {
    const { data, error } = await this.client
      .from("mock_exams")
      .select("id, subjects(name)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const subjectMap = new Map<string, number>();
    (data ?? []).forEach((exam: any) => {
      const subjectName = exam.subjects?.name ?? "Unassigned Subject";
      subjectMap.set(subjectName, (subjectMap.get(subjectName) ?? 0) + 1);
    });

    return Array.from(subjectMap.entries())
      .map(([name, examCount]) => ({ name, examCount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async calculateStudyStreak(studentId: string): Promise<number> {
    try {
      const { data, error } = await this.client
        .from("exam_attempts")
        .select("submitted_at")
        .eq("student_id", studentId)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      const dates = data.map((attempt) => new Date(attempt.submitted_at).toDateString());
      const uniqueDates = [...new Set(dates)];
      let streak = 0;
      const currentDate = new Date();

      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(currentDate.getDate() - i);
        if (uniqueDates.includes(expectedDate.toDateString())) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error("Error calculating study streak:", error);
      return 0;
    }
  }
}
