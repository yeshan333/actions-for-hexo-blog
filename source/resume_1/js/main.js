
/*
 *--------------字符串命名说明--------------------
 * introduce = 介绍
 * sty1 ==the first  style   第一种样式
 * trs1 = the first transition language   第一组过渡语
 * lingtheight == gramm lightheight     高亮语法
 * scrollRight == 源码版向右移动
 * drawBoard ==画板，用于盛放简历内容
 * resume == 简历内容
 * str == 总的拼接字符串
 * 
 */

/*字符拼接区*/
	var introduce='\n  \/*我叫叶汕，创新基地算法部成员*\/\n  \/*作为基地最菜的那个,我一直在默默追赶着大佬的脚步*\/\n  \/*进入基地一年了,很喜欢这里的学习氛围*\/\n  \/*来看看我为你们准备的菜，先来点CSS，加点基本样式....*\/';
	var sty1='\n   body{\n    transition: all 1s;\n    background:#3f5263;\n     }\n    #sourceBoard{\n    font-family:"微软雅黑";\n    overflow:auto;\n    border:3px solid black;\n    border-radius:5px;\n    width:500px;\n    height:400px;\n    font-size:16px;\n    font-weight:900;\n  }';
	var trs1 = '\n  \/*似乎有点单调，那么就让语法高亮吧*\/';
    var lightheight = '\n  #sourceBoard{\n   background:#ffffcc\n  }\n    .token.property{\n   color:#905;\n   }\n   .token.comment{\n     color:#cc3300;\n}\n    .token.selector{\n    color:#690;\n     }\n  '; 
    var trs2 = '  \/*接下来，我需要准备一下简历。先将刚才写的样式踢到一边儿去*\/'
    var scrollRight = '\n  #sourceBoard{\n    -webkit-transform: rotateY(10deg);\n    -moz-transform: rotateX(10deg);\n     position:relative;\n    left:65%; } \n    \/*OK,接下来开始准备简历板*\/\n  '
    var drawBoard = '#drawBoard{\n  color:#fff;\n  float:left;\n  position:relative;\n  top:-440px;\n  width:860px;\n  height:1850px;\n  border:5px solid black;\n   border-radius:5px;\n  overflow:auto;\n  }';
    var resume= '\n  # <center>叶汕_创新基地学习简历</center>\n  ----------------------------------------------\n  ## 经历(experience): ## \n  ----------------------------------------------\n  ### 1.2017年9月中旬那样子参加基地选拔培训 ### \n   "虽然没什么意思，但还是有点东西的"。 \n\n  ### 2. 2017年11初旬，成功混过了考核，进入基地。简单说下培训内容： ### \n  1.  嗯，和你们学的差不多\n  2.  C语言基本数据类型，顺序结构设计\n  3.  选择结构&&循环结构\n  4.  数组&&函数\n  \n----------------------------------------------\n  ### 现阶段学习方向 ### \n----------------------------------------------\n  1. python\n  2. C/C++\n  3. Python网络爬虫\n  4. 算法分析&&数据结构\n  5. (python web框架)Django\n  6. Pyqt\n \n-------\n ### 项目汇总（比较菜，什么都没有） ### \n------- \n  [https://github.com/yeshan333?tab=repositories](https://github.com/yeshan333?tab=repositories)  \n \n-------\n ### 博客\n  ------------------------------------------\n  1. CSDN博客：[我的CSDN博客](https://blog.csdn.net/qq_41022329)\n  2. GitHub博客：[我的GitHub博客](https://shansan.top) \n  3. 博客园博客：[博客园博客](https://www.cnblogs.com/sikongji-yeshan/)\n![](https://i.imgur.com/kqz0ofI.jpg)\n'
    var trs3 = '\n  \/*对了，这个简历是markdown语法，应该改成html才看着舒服。\n  *接下来变个魔术\n  *倒数3个数字\n  *3......\n  *2......\n  *1......\n  *OK,这就是为您准备的菜，祝享用愉快！ */'
	var str = introduce.concat(sty1).concat(trs1).concat(lightheight).concat(trs2).concat(scrollRight).concat(drawBoard).concat(resume).concat(trs3);

	/*常规定义区*/
	var styleTag = document.getElementById('styleTag');
	var sourceBoard = document.getElementById('sourceBoard');
	var n = 0;

	 
/*源码版控制区*/	 
var controller= setInterval(put,90);
	 function put(){

			/*吐代码区域*/
			n++;
		
			if(n>0&&n<=929){
					sourceBoard.innerHTML =str.substring(0,n)
		
		
			    styleTag.innerHTML =str.substring(0,n);
	
			}
			
			/*溢出下拉*/
			if(n>=380){
					$('#sourceBoard').animate({
						scrollTop: 1000
						}, 50);
			}
			/*代码高亮*/
			if(n>=465&&n<=929){
				sourceBoard.innerHTML =  Prism.highlight(str.substring(0,n), Prism.languages.css);
			
			}
		
		/*创建pre简历板*/
			if(n>=672&&n<=929){
				
				if(document.getElementById('drawBoard')){
					console.log('drawBoard元素已经存在');
				
				}
				else{
					var drawBoard = document.createElement('pre');
				    drawBoard.id = 'drawBoard';
				    document.body.appendChild(drawBoard);
				  
				} 

			}
			
			/*简历板溢出下拉*/
			if(n>929&&n<1885){
			var drawBoard = document.getElementById('drawBoard');
				drawBoard.innerHTML =str.substring(929,n);
				
					$('#drawBoard').animate({
						scrollTop: 1000
						}, 50);
			}

		/*简历板写完之后，需要在sourceBoard中写入魔术代码*/	
	     if(n>=1885){
	     
	     	  sourceBoard.innerHTML =  Prism.highlight(str.substring(0,929), Prism.languages.css)+Prism.highlight(str.substring(1883,n), Prism.languages.css);
	     	  
	     	  
	     }
	     
	     /*魔术代码*/
	     if(n>=1977){
	     	var drawBoard = 	document.getElementById('drawBoard');
	     	drawBoard.innerHTML =marked(str.substring(929,1885));
	     	
	     		if(n>str.length){window.clearInterval(controller)}
	     }
				
		
				
		
			console.log(n)
			
			
		
	
};
