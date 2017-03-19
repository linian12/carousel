;(function($){
  var Carousel = function (poster){
    var self = this;
    this.poster = poster;//保存单个poster对象
    this.posterList = poster.find("ul.poster-list");
    this.prevBtn = poster.find("div.poster-prev-btn");
    this.nextBtn = poster.find("div.poster-next-btn");
    this.posterItems = this.posterList.find("li");
    //偶数帧的情况下
    if(this.posterItems.size()%2 === 0){
      this.posterList.append(this.posterItems.eq(0).clone());
      this.posterItems = this.posterList.children();
    }
    this.posterFirstItem = this.posterItems.first();
    this.posterLastItem = this.posterItems.last();

    var userSetting = this.getSetting();//prototype里的方法,
    //将参数设置到this上而不是新变量
    this.setting = $.extend({},Carousel.DEFAULTS,userSetting);
    //配置参数
    //避免多次点击，动画还未完成会出现bug
    this.rotateFlag = true;
    this.prevBtn.click(function(){
      if (self.rotateFlag) {
        self.rotateFlag = false;
        self.carouselRatate("left");
      }
    });
    this.nextBtn.click(function(){
      if (self.rotateFlag) {
        self.rotateFlag = false;
        self.carouselRatate("right");//先设置flag为false，再运行函数而不能相反
      }
    });
    //是否开启自动播放
    if(this.setting.autoPlay){
      this.autoPlay();
      //鼠标移入暂停轮播
      this.poster.hover(function(){
        window.clearInterval(self.timer);
      },function(){
        self.autoPlay();
      });
    }
    this.setSettingValue();//根据窗口大小调整幻灯片宽高始终不溢出
  };
  Carousel.DEFAULTS = {
    "width":1200, //幻灯片宽度
    "height":708, //幻灯片高度
    "posterWidth":1000, //第一帧宽度
    "posterHeight":708, //第一帧高度
    "scale":0.9, //后续帧缩放比例
    "speed":600, //前后帧切换速度
    "verticalAlign": "middle", //帧对齐方式top middle bottom
    "autoPlay": "false", //是否开启自动播放
    "delay": 4000 //自动播放间隔
  };
  Carousel.prototype = {
    //获取DOM上用户设置的默认参数
    getSetting: function(){
      var userSetting = this.poster.attr("data-setting");
      if(userSetting && userSetting !== ''){
        return $.parseJSON(userSetting);
      }else{
        return '';
      }
    },
   
    setSettingValue: function(){
      var w = (this.setting.width - this.setting.posterWidth)/2;
      var h = this.setting.height;
      var top = (this.setting.height - this.setting.posterHeight)/2;

      this.poster.css({
        width: this.setting.width,
        height: this.setting.height
      });
      this.posterList.css({
        width: this.setting.width,
        height: this.setting.height
      });
      this.prevBtn.css({
        width: w,
        height: h,
        //设置上下按钮的层级
        zIndex: Math.ceil(this.posterItems.size()/2)
      });

      this.nextBtn.css({
        width: w,
        height: h,
        zIndex: Math.ceil(this.posterItems.size()/2)
      });
      //设置第一帧的位置
      this.posterFirstItem.css({
        left:w,
        height:h,
        top: top,
        width: this.setting.posterWidth,
        zIndex: Math.floor(this.posterItems.size()/2)
      });
      this.setPosterPos();
    },
    setPosterPos: function(){
        var self = this;
        var sliceItems = this.posterItems.slice(1),//保存除第一帧外的剩余帧
          sliceSize = sliceItems.size(),//剩余帧的数量
          rightItems = sliceItems.slice(0,sliceSize/2),//右边帧为剩余帧数量的一半
          leftItems = sliceItems.slice(sliceSize/2),
          level = Math.floor(this.posterItems.size()/2);//第一帧层级，即最高层级
          offLeft = (this.setting.width - self.setting.posterWidth)/2 + this.setting.posterWidth;
        var rw = this.setting.posterWidth,
          rh = this.setting.posterHeight;
          rTop = 0;
          gap = ((this.setting.width - this.setting.posterWidth)/2)/level;
        rightItems.each(function(i){
          level--;
          opacity = 0.8/(++i);
          rw = rw*self.setting.scale;
          rh = rh*self.setting.scale;
          rTop = self.setVerticalAlign(rh);
          $(this).css({
            width: rw,
            height: rh,
            zIndex: level,
            left: offLeft + gap*i - rw,
            top: rTop,
            opacity: opacity
          });
        });
        var lw = rightItems.last().width(),
          lh = rightItems.last().height();
          
        leftItems.each(function(i){
          level = level - 1;
          level++;
          lTop = self.setVerticalAlign(lh);
          $(this).css({
            width: lw,
            height: lh,
            zIndex: level,
            left: gap*i,
            top: lTop,
            opacity: opacity*(++i)
          });
          lw = lw/self.setting.scale;
          lh = lh/self.setting.scale;
        });
    },
    setVerticalAlign: function(h){
      var verticalType = this.setting.verticalAlign,
        top = 0;
      if(verticalType === "top"){
        top = 0;
      }else if(verticalType === "middle"){
        top = (this.setting.height - h)/2;
      }else if(verticalType === "bottom"){
        top = this.setting.height - h;
      }else{
        top = (this.setting.height - h)/2;//配置错误，则默认middle
      }
      return top;//一个函数尽量只有一个返回值
    },
    carouselRatate:function(dir){
      var _this = this;
      if(dir === "left"){
        this.posterItems.each(function(){
          var self = $(this),
            prev = self.prev().get(0)?self.prev():_this.posterLastItem,
            width = prev.width(),
            height = prev.height(),
            zIndex = prev.css("zIndex"),
            opacity = prev.css("opacity"),
            top = prev.css("top"),
            left = prev.css("left");
            //考虑并发性不能直接css设置index,用animate延时
          self.animate(
            {zIndex:zIndex},1,
            function(){self.animate({
              width:width,
              height:height,
              left:left,
              top:top,
              opacity:opacity
              },_this.setting.speed,function(){
                _this.rotateFlag = true;
              });
            });
        });
      }else if(dir === "right"){
        this.posterItems.each(function(){
          var self = $(this),
            next = self.next().get(0)?self.next():_this.posterFirstItem,
            width = next.width(),
            height = next.height(),
            zIndex = next.css("zIndex"),
            opacity = next.css("opacity"),
            top = next.css("top"),
            left = next.css("left");
            //考虑并发性不能直接css设置index,用animate延时,过渡完了index才出来
          self.animate(
            {zIndex:zIndex},1,
            function(){self.animate({
              width:width,
              height:height,
              left:left,
              top:top,
              opacity:opacity
              },_this.setting.speed,function(){
                _this.rotateFlag = true;
              });
            });
        });
      }
    },
    autoPlay:function(){
      var self = this;
      this.timer = window.setInterval(function(){
        self.nextBtn.click();
      },self.setting.delay);
    }
  };
  Carousel.init = function(posters){
    var _this = this;//this = Carousel
    //保存单个poster对象
    // this.poster = poster;
    // this.posterList = poster.find()
    posters.each(function(){//i索引，elem集合每一个
      new _this($(this));// $(this)=js-carouseleq(o)
    });
  };
  window["Carousel"] = Carousel;//注册一下这个类
})(jQuery);