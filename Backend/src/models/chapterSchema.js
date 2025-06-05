const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  chapter: {
    type: String,
    required: [true, 'Chapter name is required'],
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    // enum: ['Class 11', 'Class 12'],
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
  },
  yearWiseQuestionCount: {
    type: Map,
    of: {
      type: Number,
      min: 0
    },
    required: true,
    validate: {
      validator: function (value) {
        // Check all keys are valid years (4-digit numbers)
        return Object.keys(value.toObject()).every(year =>
          /^\d{4}$/.test(year)
        );
      },
      message: 'Invalid year format in yearWiseQuestionCount'
    }
  },
  questionSolved: {
    type: Number,
    required: true,
    min: [0, 'questionSolved must be 0 or greater']
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    required: true
  },
  isWeakChapter: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chapter', ChapterSchema);
