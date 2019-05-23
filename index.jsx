import React, { Component } from 'react'
import { Icon } from 'antd'

import enlarge from '@assets/images/enlarge.png'
import zoomout from '@assets/images/zoom-out.png'
import original from '@assets/images/original.png'

import './style.scss'

export default class ImgViewer extends Component {
  state = {
    currentIndex: null,   // 当前显示图片
    currentImg: null,

    scaleWidth: 0,        // 当前缩放大小
    scaleHeight: 0,
    translateZ: 0,        // 当前旋转比例
    style: { },           // 图片控制style
  };

  minWidth = 100;
  minHeight = 75;
  maxWidth = 800;
  maxHeight = 600;

  // 上下切换 flag => prev:上一张 next:下一张
  handleChange (flag) {
    let { currentIndex } = this.state;
    const { dataSource } = this.props;

    currentIndex = flag === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0) {
      currentIndex = dataSource.length - 1;
    }
    if (currentIndex > dataSource.length - 1) {
      currentIndex = 0;
    }

    const translateZ = this.resetTranslateZ();
    this.setState({
      scaleWidth: 0,
      scaleHeight: 0,
      translateZ,
    }, () => {
      this.handleReset(currentIndex, dataSource[currentIndex]);
    })
  }

  // 放大缩小 flag => large:放大 zoomout:缩小 original:原图
  handleScale (flag) {
    const { currentImg, scaleWidth, scaleHeight } = this.state;

    // 等分6份后的平均伸缩值
    let avgWidth = (currentImg.width - this.minWidth) >= (this.maxWidth - currentImg.width) ? (currentImg.width - this.minWidth) / 6 : (this.maxWidth - currentImg.width) / 6;
    let avgHeight = (currentImg.height - this.minHeight) >= (this.maxHeight - currentImg.height) ? (currentImg.height - this.minHeight) / 6 : (this.maxHeight - currentImg.height) / 6;
    let widthChange = 0;  // 改变大小
    let heightChange = 0;

    if (currentImg.width / currentImg.height >= this.minWidth / this.minHeight) {
      widthChange = flag === 'large' ? scaleWidth + avgWidth : flag === 'zoomout' ? scaleWidth - avgWidth : 0;
      heightChange = widthChange / (currentImg.width / currentImg.height);
    } else {
      heightChange = flag === 'large' ? scaleHeight + avgHeight : flag === 'zoomout' ? scaleHeight - avgHeight : 0;
      widthChange = (currentImg.width / currentImg.height) * heightChange;
    }

    this.setImgSize(flag, widthChange, heightChange);
  }

  // 图片大小设置 始终以 width 为变更基准
  setImgSize (flag, widthChange, heightChange) {
    let { currentImg, scaleWidth, scaleHeight, translateZ } = this.state;

    let style = { };
    const width = currentImg.width + (widthChange);
    const height = currentImg.height + (heightChange);

    // 两者都小于最小值
    if (width < this.minWidth && height <= this.minHeight && width / height < this.minWidth / this.minHeight) {
      style = { width: this.minWidth };
    }
    else if (width <= this.minWidth && height < this.minHeight && width / height > this.minWidth / this.minHeight) {
      style = { width: width / height * this.minHeight };
    }

    // 一方小于最小值 而另一方大于最大值
    else if (width < this.minWidth && height > this.maxHeight) {
      style = { width: width / height * this.maxHeight };
    }
    else if (height < this.minHeight && width > this.maxWidth) {
      style = { width: this.maxWidth };
    }

    // 一方介于最小值与最大值之间 一方大于最大值
    else if (width >= this.minWidth && width <= this.maxWidth && height > this.maxHeight) {
      style = { width: width / height * this.maxHeight };
    }
    else if (height >= this.minHeight && height <= this.maxHeight && width > this.maxWidth) {
      style = { width: this.maxWidth };
    }

    // 两者都大于最大值
    else if (width > this.maxWidth && height > this.maxHeight) {
      if (width / height <= this.minWidth / this.minHeight) {
        style = { width: width / height * this.maxHeight };
      } else {
        style = { width: this.maxWidth };
      }
    }

    // 符合规则 即变更缩放大小,否则不更新
    else {
      style = { width: width };
      scaleWidth = widthChange;
      scaleHeight = heightChange;
    }

    const newTranslateZ = this.resetTranslateZ();

    this.setState({
      scaleWidth,
      scaleHeight,
      translateZ: flag === 'original' ? newTranslateZ : translateZ,
      style
    });
  }

  // 旋转
  handleTranslate () {
    let { translateZ } = this.state;
    this.setState({
      translateZ: translateZ + 90
    });
  }

  // 为防止出现图片旋转多次的现象,主要是点击上下切换 及 1:1 按钮
  resetTranslateZ () {
    let { translateZ } = this.state;
    if (translateZ / 90 % 2 === 0 && translateZ % 360 / 180 % 2 === 1) {
      translateZ = translateZ - 180;
    } else if (translateZ / 90 % 2 === 1) {
      if (translateZ % 360 / 90 % 3 === 0) {
        translateZ = translateZ + 90;
      } else {
        translateZ = translateZ - 90;
      }
    }
    return translateZ
  }

  // 因图片存在大小远超最大限制宽高，所以需要将此类图片的宽高重置，且还需保留原始宽高比
  handleReset (index, current) {
    let currentImg = current ? current : this.props.dataSource[this.props.index];
    const width = currentImg.width;
    const height = currentImg.height;
    const widthMinFix = Object.assign({}, currentImg, { width: this.minWidth, height: this.minWidth / (width / height) });
    const heightMinFix = Object.assign({}, currentImg, { width: width / height * this.minHeight, height: this.minHeight });
    const widthMaxFix = Object.assign({}, currentImg, { width: this.maxWidth, height: this.maxWidth / (width / height) });
    const heightMaxFix = Object.assign({}, currentImg, { width: width / height * this.maxHeight, height: this.maxHeight });

    // 两者都小于最小值
    if (width < this.minWidth && height <= this.minHeight && width / height < this.minWidth / this.minHeight) {
      currentImg = widthMinFix;
    }
    else if (width <= this.minWidth && height < this.minHeight && width / height > this.minWidth / this.minHeight) {
      currentImg = heightMinFix;
    }

    // 一方小于最小值 而另一方介于最小值与最大值之间 不予考虑

    // 一方小于最小值 而另一方大于最大值
    else if (width < this.minWidth && height > this.maxHeight) {
      currentImg = heightMaxFix;
    }
    else if (height < this.minHeight && width > this.maxWidth) {
      currentImg = widthMaxFix;
    }

    // 两者都介于最小值与最大值之间 不予考虑

    // 一方介于最小值与最大值之间 一方大于最大值
    else if (width >= this.minWidth && width <= this.maxWidth && height > this.maxHeight) {
      currentImg = heightMaxFix;
    }
    else if (height >= this.minHeight && height <= this.maxHeight && width > this.maxWidth) {
      currentImg = widthMaxFix;
    }

    // 两者都大于最大值
    else if (width > this.maxWidth && height > this.maxHeight) {
      if (width / height <= this.minWidth / this.minHeight) {
        currentImg = heightMaxFix;
      } else {
        currentImg = widthMaxFix;
      }
    }

    this.setState({
      currentIndex: index || index === 0 ? index : this.props.index,
      currentImg,
      style: { width: currentImg.width }
    })
  }

  componentDidMount () {
    this.handleReset();
  }

  render () {
    const { onCancel } = this.props;
    let { currentImg, style, translateZ } = this.state;

    if (translateZ) {
      style = Object.assign({}, style, { transform: `rotate(${ translateZ }deg)` });
    }

    return (
      <div onClick={ () => onCancel()} className="img-modal-mask">
        <div className="img-wrap">
          <img onClick={ (e) => e.stopPropagation() } style={style} src={ currentImg && currentImg.src } />
          <div onClick={ (e) => e.stopPropagation() } className="img-operater">
            <Icon onClick={ () => this.handleChange('prev') } type="left" />
            <Icon onClick={ () => this.handleChange('next') } type="right" />
            <img onClick={ () => this.handleScale('large') } src={ enlarge } />
            <img onClick={ () => this.handleScale('zoomout') } src={ zoomout } />
            <img onClick={ () => this.handleScale('original') } src={ original } className='original' />
            <Icon onClick={ () => this.handleTranslate() } type="reload" />
            <Icon onClick={ () => onCancel() } type="close" />
          </div>
        </div>
      </div>
    )
  }
}
