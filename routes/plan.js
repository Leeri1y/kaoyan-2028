const express = require('express');
const router = express.Router();
// 阶段/任务数据统一从 data/plan-phases.js 读取，和 checkin.js 共用同一份，
// 避免两处各写一份、改一处忘另一处
const { PHASES, phaseForDate } = require('../data/plan-phases');

const SYLLABUS = [
  { ch: 1, title: '自动控制系统的基本概念', pts: ['自动控制系统的基本原理', '开环/闭环控制系统', '闭环系统的组成与基本环节', '系统类型', '基本性能要求'] },
  { ch: 2, title: '自动控制系统的数学模型', pts: ['傅里叶变换与拉普拉斯变换', '时域数学模型', '频域数学模型', '结构图与信号流图'] },
  { ch: 3, title: '线性系统的时域分析法', pts: ['时域性能指标', '一阶/二阶系统分析', '高阶系统分析', '稳定性分析', '稳态误差计算'] },
  { ch: 4, title: '线性系统的根轨迹法', pts: ['根轨迹基本概念', '根轨迹绘制方法', '广义根轨迹', '基于根轨迹的性能分析'] },
  { ch: 5, title: '线性系统的频域分析法', pts: ['频率特性及表示法', '典型环节与开环频率特性', '频域稳定判据', '频域稳定裕度', '闭环频域性能指标'] },
  { ch: 6, title: '控制系统的校正与综合', pts: ['校正的一般概念', '常用校正装置及特性', '串联校正'] },
];

const EXAM_INFO = {
  initial: ['101思想政治理论', '204英语（二）', '302数学（二）', '864自动控制原理（自命题，含微机原理及单片机技术和控制工程）'],
  major: ['《自动控制原理基础教程》第四版，胡寿松，科学出版社，2017（大纲主用）', '《自动控制原理》第七版，胡寿松，科学出版社，2019（补充）', '《自动控制原理》第二版，吴麒等，清华大学出版社，2016（补充视角）'],
  retest: ['《C程序设计》第五版，谭浩强，清华大学出版社，2017', '《计算机控制系统》第二版，李华，机械工业出版社，2017'],
};

const APP_RECS = [
  { category: '政治刷题', name: '苍盾考研', platform: '微信小程序', desc: '肖1000题、肖四肖八、腿姐、徐涛等主流老师题库全覆盖，碎片时间刷选择题' },
  { category: '政治刷题', name: '考研政治刷题', platform: 'iOS/Android', desc: '各名师题库，章节练习 + 错题收藏' },
  { category: '英语单词', name: '墨墨背单词', platform: 'iOS/Android', desc: '基于艾宾浩斯遗忘曲线，考研词库完整，推荐每天50个' },
  { category: '英语单词', name: '不背单词', platform: 'iOS/Android', desc: '语境记忆法，真实例句，适合考研长难句积累' },
  { category: '英语单词', name: '百词斩', platform: 'iOS/Android', desc: '图文结合，适合初期快速过词' },
  { category: '英语阅读', name: '张剑黄皮书', platform: '纸质书', desc: '考研英语真题圣经，逐题解析+精读翻译' },
  { category: '英语作文', name: '王江涛考研英语', platform: '纸质书/B站', desc: '大小作文范文+模板，推荐冲刺期背诵' },
  { category: '数学', name: '武忠祥B站', platform: 'B站免费', desc: '高数基础+强化+冲刺全系列' },
  { category: '数学', name: '李永乐B站', platform: 'B站免费', desc: '线代王，强化班必看' },
  { category: '专业课', name: '中国大学MOOC', platform: 'iOS/Android/Web', desc: '自动控制原理国家精品课' },
  { category: '专业课', name: '胡寿松《自动控制原理》', platform: '纸质书/B站', desc: '指定教材，配合B站讲解视频' },
  { category: '笔记工具', name: 'Notion', platform: 'iOS/Android/Web', desc: '做个人知识库，整理专业课笔记' },
  { category: '笔记工具', name: 'GoodNotes / 华为笔记', platform: 'iPad/Android', desc: '手写笔记，错题本+思维导图' },
  { category: '笔记工具', name: 'Anki', platform: 'iOS/Android/PC', desc: '间隔重复记忆，适合背诵专业课概念和公式' },
];

router.get('/phases', (req, res) => {
  res.json(PHASES);
});

router.get('/apps', (req, res) => {
  res.json(APP_RECS);
});

router.get('/current', (req, res) => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  res.json({ currentPhase: phaseForDate(dateStr), date: dateStr });
});

router.get('/syllabus', (req, res) => {
  res.json({ syllabus: SYLLABUS, exam: EXAM_INFO });
});

module.exports = router;
