/**
 * 公共弹窗
 * @author liujiahui
 * @param {string} title 弹窗标题
 * @param {string} content 弹窗内容
 */
class ShowModel {
  constructor(title, content, backgroundMask = false) {
    this.title = title;
    this.content = content;
    this.backgroundMask = backgroundMask;
    this.dialog = document.querySelector("dialog");
    // 给dialog标签添加属性backgroundMask
    this.dialog.setAttribute("backgroundMask", this.backgroundMask);
    this.init();
  }

  init() {
    this.show();
    this.dialog.addEventListener("click", (event) => {
      if (event.target.classList.contains("dialog_cancel") || (event.target.tagName == "DIALOG" && this.backgroundMask == true)) {
        this.close();
      }
    });
  }

  show() {
    this.dialog.showModal();
    this.model = document.createElement("div");
    this.model.className = "dialog_box";
    this.model.innerHTML = `
      <div class="dialog_title">${this.title}</div>
      <div class="dialog_content">${this.content}</div>
      <div class="dialog_btn_box">
          <div class="dialog_cancel">关&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;闭</div>
      </div>
    `;
    this.dialog.appendChild(this.model);
  }

  close() {
    this.dialog.close(); //移除dom元素
    this.model.remove();
  }
}

let isShowDialog = false;
let workTime = [];
let weekendArr = []; //周末数据
let tableArr = []; //表格数据

let WorkStartTimeArray = []; // 开始时间

let WorkEndTimeArray = []; // 结束时间
let container = document.getElementById("container");
let container2 = document.getElementById("container2");

let btnStatus = -1; //默认0  0-周六周日除外   1-包含周六周日
let localStatus = -1; //默认0  0-周六周日除外   1-包含周六周日
let textareaID = document.getElementById("textareaID");

let dateBox = document.getElementsByClassName("date_box")[0];
let tableBox = document.getElementsByClassName("table_box")[0];

// 获取类名为table_box中tbody中的tr元素
let tbody = document.querySelector("tbody");
// console.log("tbody: ", tbody);

// 监听textarea的输入
textareaID.addEventListener("change", function () {
  let textareaValue = document.querySelector("textarea").value.replace(/}, {/g, "}|{"); //将逗号替换为竖线
  // 如果textareaValue最后有逗号，则删除逗号
  if (textareaValue.slice(-1) == ",") {
    textareaValue = textareaValue.slice(0, -1);
  }
  textareaValue = JSON.parse(textareaValue);
  textareaValue.forEach((item) => {
    // 如果最后一个元素的type为1，则给数组最后再加入一个元素，该元素为之前的最后一个元素，并且把type改为2，时间加上10小时(标准8小时)
    if (item.type == "1" && textareaValue[textareaValue.length - 1].type == "1") {
      textareaValue.push({
        ...textareaValue[textareaValue.length - 1],
        type: "2",
        checktime: formatDateTime(new Date(textareaValue[textareaValue.length - 1].checktime).getTime() + 10 * 60 * 60 * 1000),
      });
    }
  });
  workTime = textareaValue;
  pushTimes(); //输入完数据后，调用pushTimes方法，处理数据
  calculateAlltimes(); // 随后调用calculateAlltimes方法，计算工时
});
// ***********************************处理日历选择 start***********************************
// 获取类名为ipt_date的元素
let ipt_date = document.getElementsByClassName("ipt_date")[0];
let today = new Date();
// 选择日历后，触发事件
ipt_date.addEventListener("input", function () {
  let month = new Date().getMonth() + 1; // 获取当前日期的星期几
  month = month < 10 ? "0" + month : month;
  let chooseMonthNow = ipt_date.value.slice(5, 7);

  if (chooseMonthNow > month || chooseMonthNow < month) {
    let message = chooseMonthNow > month ? `所选日期不能<strong style="font-size: 16px;">大于</strong>当前月` : `所选日期不能<strong style="font-size: 16px;">小于</strong>当前月`;

    new ShowModel("提示", message, true);
    ipt_date.value = "";
    return;
  }

  workTime.forEach((item) => {
    if (item.type == "1" && ipt_date.value == item.dt) {
      WorkStartTimeArray.push(item.checktime);

      // 数组去重并排序
      WorkStartTimeArray = [...new Set(WorkStartTimeArray)].sort((a, b) => {
        return new Date(a) - new Date(b);
      });
    } else if (item.type == "2" && ipt_date.value == item.dt) {
      WorkEndTimeArray.push(item.checktime);

      // 数组去重并排序
      WorkEndTimeArray = [...new Set(WorkEndTimeArray)].sort((a, b) => {
        return new Date(a) - new Date(b);
      });
    }
  });
  if (workTime.length == 0) {
    new ShowModel("提示", `请先输入数据`, true);
    ipt_date.value = "";
    return;
  }
  if (btnStatus == -1) {
    new ShowModel("提示", `请选择"周末除外"或"单独计算周末"`, true);
    ipt_date.value = "";
    return;
  }
  new ShowModel("提示", "已更新数据，请查看具体工时", true);
  calculateAlltimes();
});
// ***********************************处理日历选择 end***********************************

/**
 *  转换时间格式
 * @author liujiahui
 * @param {string} textareaTime 时间格式:YYYY-MM-DD HH:mm:ss
 */
function formatDateTime(textareaTime) {
  var date = new Date(textareaTime);
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? "0" + m : m;
  var d = date.getDate();
  d = d < 10 ? "0" + d : d;
  var h = date.getHours();
  h = h < 10 ? "0" + h : h;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  minute = minute < 10 ? "0" + minute : minute;
  second = second < 10 ? "0" + second : second;
  return y + "-" + m + "-" + d + " " + h + ":" + minute + ":" + second;
}

/**
 *  选择计算哪种数据
 * @param {number} status 控制按钮状态，0-周末除外   1-单独计算周末
 */
function changeStatus(status) {
  console.log("status: ", status);
  if (workTime.length === 0 && isShowDialog == false) {
    new ShowModel("使用提示", `开始使用可以点击左侧tips来查看如何使用工具`, true);
    isShowDialog = true;
    return;
  }
  if (workTime.length === 0) {
    new ShowModel("提示", `请先输入数据`, true);
    return;
  }
  localStorage.setItem("localStatus", status);
  localStatus = localStorage.getItem("localStatus", status);
  pushTimes();
}
/**
 * 处理数据，把数据按照type分类
 *
 */
function pushTimes() {
  btnStatus = localStatus;
  WorkStartTimeArray = [];
  WorkEndTimeArray = [];

  workTime.forEach((item) => {
    const time = new Date(item.checktime);
    if (btnStatus == 0 && time.getDay() > 0 && time.getDay() <= 5) {
      item.type === "1" ? WorkStartTimeArray.push(item.checktime) : WorkEndTimeArray.push(item.checktime);
    }
    if (btnStatus == 1 && (time.getDay() == 6 || time.getDay() == 0)) {
      item.type === "1" ? WorkStartTimeArray.push(item.checktime) : WorkEndTimeArray.push(item.checktime);
    }
  });
}
/**
 * 计算工时
 * @param {string} startTime 打卡开始时间
 * @param {string} endTime  打卡结束时间
 * @returns {number} workTime 有效返回工时
 */
function calculateWorkTime(startTime, endTime) {
  let start = new Date(startTime);
  let end = new Date(endTime);
  const days = ["日", "一", "二", "三", "四", "五", "六"];

  // 迟到判断
  if (start.getHours() >= 9 && start.getMinutes() >= 1) {
    const dayOfWeek = days[start.getDay()];
    new ShowModel("迟到异常", `${startTime} 星期${dayOfWeek}迟到,有打卡异常`, true);
  }

  //早退
  if (end.getHours() < 17 || (end.getHours() === 17 && end.getMinutes() < 30)) {
    const dayOfWeek = days[start.getDay()];

    const alertMsg = `${endTime} 星期${dayOfWeek}早退,有打卡异常`;
    new ShowModel("早退异常", alertMsg, true);
  }

  // 提前打卡或者迟到打卡
  if (start.getHours() !== 8) {
    start = new Date(`${startTime.slice(0, -8)} 08:00:00`);
  }
  if (end.getHours() === 17 && end.getMinutes() > 30) {
    end = new Date(`${startTime.slice(0, -8)} 17:30:00`);
  }
  const timeDiff = end - start;
  let workTime = timeDiff / (1000 * 60 * 60);
  if (btnStatus == 0) {
    if (end.getHours() < 18) {
      workTime -= 1.5;
    } else {
      workTime -= 2; //17:30 到 18:00 半小时，中午1个半小时，总共2小时
    }

    console.log(`有效工时：${workTime.toFixed(4)}  打卡时间：${startTime} - ${endTime}`);
  } else if (btnStatus == 1) {
    workTime -= 1.5;
    let str = `有效工时：${workTime.toFixed(4)}  打卡时间：${startTime} - ${endTime}`;
    // console.log("str: ", str);
    weekendArr.push(str);
  }
  // ***********************把数据渲染到表格中 start*************************
  let dateTime = startTime.slice(0, 10);
  let effectiveTime = workTime.toFixed(4);
  let checkTime = startTime + "—" + endTime;
  tableArr = [];
  tableArr.push({
    dateTime: dateTime,
    effectiveTime: effectiveTime,
    checkTime: checkTime,
  });
  // 把数组中的数据添加到tbody中的tr元素中
  let tr = document.createElement("tr");
  tableArr.forEach((item) => {
    tr.innerHTML = `
      <td>${item.dateTime}</td>
      <td>${item.effectiveTime}</td>
      <td>${item.checkTime}</td>
      `;
    tbody.appendChild(tr);
    // console.log("tbody: ", tbody);
  });
  // ***********************把数据渲染到表格中 end*************************
  return workTime;
}

// 解析数据
function calculateAlltimes() {
  console.log("btnStatus: ", btnStatus);
  if (workTime.length === 0 && isShowDialog == false) {
    new ShowModel("使用提示", `开始使用可以点击左侧tips来查看如何使用工具`, true);
    isShowDialog = true;
    return;
  }
  if (workTime.length == 0) {
    new ShowModel("提示", `请先输入数据`, true);
    return;
  }
  if (btnStatus == -1) {
    new ShowModel("提示", `请选择"周末除外"或"单独计算周末"`, true);
    return;
  }
  if (WorkStartTimeArray.length !== WorkEndTimeArray.length) {
    new ShowModel("缺失", `缺少${WorkStartTimeArray.length > WorkEndTimeArray.length ? "结束" : ",true开始"}工时`);
    return;
  }
  tableBox.style.display = "block";
  // 清空表格数据
  tbody.innerHTML = "";
  let workAllTime = 0;
  weekendArr = []; // 把打印的周末数据先清空，防止累加重复打印

  ipt_date.value = "";
  for (let i = 0; i < WorkStartTimeArray.length; i++) {
    const startTime = WorkStartTimeArray[i];
    const endTime = WorkEndTimeArray[i];
    const time = calculateWorkTime(startTime, endTime);
    workAllTime += time;
  }
  if (btnStatus == 0) {
    container2.innerHTML = `本月总工时：${workAllTime.toFixed(2)}, &nbsp;&nbsp;平均工时为:${(workAllTime / WorkStartTimeArray.length).toFixed(2)}`;
  } else if (btnStatus == 1) {
    container2.innerHTML = ``; // 清除上一次解析显示的内容，防止内容重复累加
    // 把文字添加到ID为container2的容器中
    for (let i = 0; i < weekendArr.length; i++) {
      container2.innerHTML += `<p>${weekendArr[i]}</p>`;
    }
  }
}
let searchBox = document.getElementsByClassName("search")[0];
let imgBox = document.getElementsByClassName("img_box")[0];
let closeBox = document.getElementsByClassName("close_search")[0];
searchBox.addEventListener("click", search);
closeBox.addEventListener("click", closeSearch);
// 是否打开查询方法DOM 元素
function search() {
  imgBox.style.display = "block";
  closeBox.style.display = "block";
}
// 是否关闭查询方法DOM 元素
function closeSearch() {
  imgBox.style.display = "none";
  closeBox.style.display = "none";
}
