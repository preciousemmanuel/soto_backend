import AWS from 'aws-sdk';

AWS.config.update({
    region:process.env.AWS_REGION,
  
  });
  

  const publishSns=(data:any,topic?:string,phone?:string)=>{
const sns=new AWS.SNS({
    accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
});

let params:any={
    Message:data,
   
}

if (phone) {
    params["PhoneNumber"]=phone;
}else{
    params.TopicArn=topic;
}
console.log("sdsadda",params)

sns.publish(params,(err,data)=>{
    if (err) {
        console.error('Error sending message:', err);
      } else {
        console.log('Message sent:', data.MessageId);
      }
})
  }


  function createSnsConsumer(protocol:string="sqs",topicArn:string,queueUrl?:string) {
    const sns=new AWS.SNS({
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    });

    const subscribeParams = {
        Protocol: 'sqs',
        TopicArn: topicArn,
        Endpoint: queueUrl
      };
    
      sns.subscribe(subscribeParams, (err, data) => {
        if (err) {
          console.error('Error subscribing SQS queue to SNS topic:', err);
        } else {
          console.log('SQS queue subscribed to SNS topic');
        }
      });
  };


  export default {publishSns,createSnsConsumer}