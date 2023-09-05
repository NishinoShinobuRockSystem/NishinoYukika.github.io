// $(document).ready(function(){
//     //カーソルの変更
//     //マウスが置かれたらclass「on_mouse」を追加、外れたら「on_mouse」を削除
//     $('.change').on('mouseover', function() {
//         $(this).addClass('on_mouse');
//     }).on('mouseout', function() {
//         $(this).removeClass('on_mouse');
//     });

//     //マウスの位置にあわせて画像のCSSを指定
//     function mouseMove(e) {
//         $('#cursor').css({
//         'top': e.clientY,
//         'left': e.clientX
//         });
//     }
//     $('.change').on('mousemove', mouseMove);
// });

$(function(){
    //カーソル要素の指定
    var cursor=$("#cursor");
    //mousemoveイベントでカーソル要素を移動させる
    $(document).on("mousemove",function(e){
                 //カーソルの座標位置を取得
      var x=e.clientX;
      var y=e.clientY;
      //カーソル要素のcssを書き換える用
      cursor.css({
        "opacity":"1",
        "top":y+"px",
        "left":x+"px"
      });
    });
  });