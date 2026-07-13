import Exam from "../models/exams.js";
import ExamResult from "../models/examResults.js";
import { v4 as uuidv4 } from "uuid";

// ดูรายการข้อสอบทั้งหมด (พร้อมจำนวนข้อ)
export const getAllExams = async (request, response) => {
  try {
    const exams = await Exam.find().select("-questions.correct_option_id");

    // เพิ่มจำนวนข้อในแต่ละชุดข้อสอบ
    const examsWithCount = exams.map((exam) => ({
      _id: exam._id,
      exam_name: exam.exam_name,
      description: exam.description,
      category: exam.category,
      time_limit_minutes: exam.time_limit_minutes,
      question_count: exam.questions.length,
      createdAt: exam.createdAt,
    }));

    return response.json(examsWithCount);
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ดึงรายการข้อสอบไม่สำเร็จ: ${err.message}` });
  }
};

// ดูรายละเอียดข้อสอบตาม ID (ไม่ส่ง correct_option_id)
export const getExamById = async (request, response) => {
  try {
    const { id } = request.params;
    const exam = await Exam.findOne({ _id: id });

    if (!exam) {
      return response.status(404).json({ msg: "ไม่พบข้อสอบชุดนี้" });
    }

    // ซ่อนเฉลยก่อนส่งกลับ (ป้องกันทุจริต)
    const examWithoutAnswer = exam.toObject();
    examWithoutAnswer.questions = examWithoutAnswer.questions.map((q) => ({
      _id: q._id,
      question_text: q.question_text,
      options: q.options,
    }));

    return response.json(examWithoutAnswer);
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// 🛡️ ดูข้อสอบแบบครบทุก field (สำหรับ Admin แก้ไขข้อสอบ)
export const getExamByIdForAdmin = async (request, response) => {
  try {
    const { id } = request.params;
    const exam = await Exam.findOne({ _id: id });

    if (!exam) {
      return response.status(404).json({ msg: "ไม่พบข้อสอบชุดนี้" });
    }

    return response.json(exam);
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// ดูข้อสอบพร้อมเฉลย (สำหรับดูเฉลยหลังทำเสร็จ)
export const getExamWithAnswerKey = async (request, response) => {
  try {
    const { id } = request.params;
    const exam = await Exam.findOne({ _id: id });

    if (!exam) {
      return response.status(404).json({ msg: "ไม่พบข้อสอบชุดนี้" });
    }

    return response.json(exam);
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// ส่งคำตอบและตรวจคะแนน
// ส่งคำตอบและตรวจคะแนน (เวอร์ชันแก้ไขบั๊กตรวจคำตอบผิดพลาด)
export const submitExam = async (request, response) => {
  try {
    const userId = request.user.userId;
    const { exam_id, answers, time_spent_seconds } = request.body;

    // ค้นหาข้อสอบ
    const exam = await Exam.findOne({ _id: exam_id });
    if (!exam) {
      return response.status(404).json({ msg: "ไม่พบข้อสอบชุดนี้" });
    }

    let correctCount = 0;
    const answerDetails = [];

    // ตรวจคำตอบทีละข้อ
    for (const question of exam.questions) {
      let userAnswer = "";

      // 🛠️ แก้จุดพังที่ 1: รองรับคำตอบทั้งแบบ Array (จากหน้าบ้านล่าสุด) และแบบ Object ดั้งเดิม
      if (Array.isArray(answers)) {
        const found = answers.find(
          (a) => String(a.question_id) === String(question._id),
        );
        userAnswer = found ? found.selected_option_id : "";
      } else if (answers && typeof answers === "object") {
        userAnswer = answers[question._id] || "";
      }

      const userAnsStr = String(userAnswer).trim();
      const dbCorrectOptionId = String(question.correct_option_id).trim();
      let isCorrect = false;

      // 🛠️ แก้จุดพังที่ 2: ตรวจสอบตรรกะเฉลยแบบ 2 ระบบ (รองรับทั้ง A-D และ UUID สตริงยาว)
      const indexMapping = { A: 0, B: 1, C: 2, D: 3 };

      if (indexMapping[dbCorrectOptionId] !== undefined) {
        // เคสที่ 1: ใน DB เก็บเฉลยเป็นอักษร "A", "B", "C", "D"
        const targetIndex = indexMapping[dbCorrectOptionId];
        const targetOption = question.options[targetIndex];
        if (targetOption && userAnsStr === String(targetOption._id).trim()) {
          isCorrect = true;
        }
      } else {
        // เคสที่ 2: ใน DB เก็บเฉลยเป็น ID UUID สตริงยาวตรงๆ
        if (userAnsStr === dbCorrectOptionId) {
          isCorrect = true;
        }
      }

      if (isCorrect) correctCount++;

      // ค้นหา ID ที่ถูกต้องจริงๆ เพื่อส่งกลับไปให้ Frontend ทำการไฮไลต์สีเขียวได้แม่นยำ
      let actualCorrectAnswerId = dbCorrectOptionId;
      if (indexMapping[dbCorrectOptionId] !== undefined) {
        const targetOption = question.options[indexMapping[dbCorrectOptionId]];
        if (targetOption) actualCorrectAnswerId = String(targetOption._id);
      }

      answerDetails.push({
        question_id: question._id,
        question_text: question.question_text,
        user_answer: userAnsStr,
        correct_answer: actualCorrectAnswerId, // 🛠️ ส่ง ID ตัวเลือกที่ถูกจริงกลับไป (เพื่อให้ Frontend แมตช์กับ opt._id ติด)
        is_correct: isCorrect,
        explanation: question.explanation || "",
        options: question.options,
      });
    }

    // คำนวณคะแนน (คิดเป็นเปอร์เซ็นต์)
    const totalQuestions = exam.questions.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    // บันทึกผลการทำข้อสอบ
    const newResult = new ExamResult({
      _id: uuidv4(),
      user_id: userId,
      exam_id: exam_id,
      score: score,
      total_questions: totalQuestions,
      correct_count: correctCount,
      time_spent_seconds: time_spent_seconds || 0,
      answers: answers,
      completed_at: new Date(),
    });

    await newResult.save();

    return response.status(201).json({
      msg: "ตรวจคำตอบสำเร็จ",
      result: {
        _id: newResult._id,
        score: score,
        total_questions: totalQuestions,
        correct_count: correctCount,
        time_spent_seconds: time_spent_seconds || 0,
        completed_at: newResult.completed_at,
      },
      answer_details: answerDetails, // ส่งเฉลยกลับไป
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ส่งข้อสอบไม่สำเร็จ: ${err.message}` });
  }
};

// ดูประวัติการทำข้อสอบของผู้ใช้
export const getMyExamHistory = async (request, response) => {
  try {
    const userId = request.user.userId;
    const { exam_id } = request.query; // ถ้าส่ง exam_id มา จะกรองเฉพาะข้อสอบชุดนั้น

    const filter = { user_id: userId };
    if (exam_id) {
      filter.exam_id = exam_id;
    }

    const history = await ExamResult.find(filter)
      .sort({ completed_at: -1 })
      .limit(50);

    return response.json(history);
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// ดูประวัติล่าสุดของข้อสอบชุดเฉพาะ
export const getMyLatestResult = async (request, response) => {
  try {
    const userId = request.user.userId;
    const { exam_id } = request.params;

    const latestResult = await ExamResult.findOne({
      user_id: userId,
      exam_id: exam_id,
    }).sort({ completed_at: -1 });

    if (!latestResult) {
      return response.json(null);
    }

    return response.json(latestResult);
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// สร้างข้อสอบใหม่ (สำหรับ admin)
export const createExam = async (request, response) => {
  try {
    const examData = request.body;
    const newExam = new Exam({
      ...examData,
      _id: uuidv4(),
    });

    const savedExam = await newExam.save();
    return response
      .status(201)
      .json({ msg: "สร้างข้อสอบสำเร็จ", data: savedExam });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `สร้างข้อสอบไม่สำเร็จ: ${err.message}` });
  }
};

// แก้ไขข้อสอบ (สำหรับ admin)
export const updateExam = async (request, response) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    const updatedExam = await Exam.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true },
    );

    if (!updatedExam) {
      return response.status(404).json({ msg: "ไม่พบข้อสอบที่ต้องการแก้ไข" });
    }

    return response.json({ msg: "แก้ไขข้อสอบสำเร็จ", data: updatedExam });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `แก้ไขข้อสอบไม่สำเร็จ: ${err.message}` });
  }
};

// ลบข้อสอบ (สำหรับ admin)
export const deleteExam = async (request, response) => {
  try {
    const { id } = request.params;
    const deletedExam = await Exam.findOneAndDelete({ _id: id });

    if (!deletedExam) {
      return response.status(404).json({ msg: "ไม่พบข้อสอบที่ต้องการลบ" });
    }

    return response.json({ msg: "ลบข้อสอบสำเร็จ" });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};
