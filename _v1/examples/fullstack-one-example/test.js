var l = (num) => {
	return `INSERT INTO "public"."User"("tenantId","email","password","gender","payload","testDefault","acceptedPrivacyTermsAtInUTC","acceptedPrivacyTermsVersion","updatedAt","createdAt","postContributionsIdsArray") VALUES (E'default',E'dustin${num}@fullstack.build',E'{"providers": {"local": {"hash": "$2a$06$v7zBCRO6kpoQReBuuKytceFqP9D7WW7ARmd6Tk.cGMCC9YsdquqCi", "meta": {"salt": "7c1ca4acbdc0413e40b0f8e2769a8825", "memlimit": 67108864, "opslimit": 2, "algorithm": 2, "hashBytes": 128}}}, "invalidTokens": [], "totalLogoutTimestamp": 1528362056830}',NULL,NULL,NULL,E'2018-06-07 08:44:19.61',0,E'2018-06-08 16:20:23.081',NULL,NULL);`;
}

var post = (title, content, secret, userId) => {
	return `INSERT INTO "public"."Post"("title","content","images","ownerSecret","contributorSecret","ownerId","contributorsIdsArray") VALUES (E'${title}',E'${content}',NULL,E'${secret}',NULL,E'${userId}',NULL);`
}

var users = [{"id":"7e9da865-f78a-446c-b68d-58c127a6fefb"}, {"id":"2646a365-7222-40ef-bbd5-fadb16e2af1a"}, {"id":"0153432c-5f54-4594-a708-75356b51eb0e"}, {"id":"6e46f24b-3a8d-4b0a-876e-6b2749506146"}, {"id":"5d073304-eb89-440c-a5ea-69f6ea2256ab"}, {"id":"a111f8a1-1268-4617-91b2-ef99b11d4b50"}, {"id":"620ac5dd-f238-4dc2-93be-4ba86f12831b"}, {"id":"3fecefb8-8e0b-44d7-99f3-8f17b524fda0"}, {"id":"d47a1b4f-2995-44b5-9b13-966fc8061d1a"}, {"id":"06dfec48-e37b-4166-ad02-6e2e37e99e19"}, {"id":"1f069c0d-165d-4b38-a526-4508d3a3b785"}, {"id":"3d016a3b-db45-4d1a-bad4-b8c03d86768a"}, {"id":"0d9aea4c-9694-4935-a6dc-440a95787f32"}, {"id":"3d258016-bbe8-495d-91a4-b36b66b8b951"}, {"id":"a1b5c94a-d9ca-498e-9aec-dae217c7c39e"}, {"id":"4e513abc-9102-46d5-bacd-d43ae7dc30bf"}, {"id":"5f9c98ed-044a-4543-9715-56ddf5b7e3e1"}, {"id":"df877416-4203-4c3e-a5bc-617f2875251b"}, {"id":"16240724-5c19-44a3-bb10-e2d50481cee6"}, {"id":"b6d3f8e3-f443-467c-847f-86ffd1a8caad"}, {"id":"4ca8af6f-3a6a-40ab-9367-cd1aa80a489b"}, {"id":"9ca4974a-133d-458e-a9ad-f48983475a93"}, {"id":"12a99e91-66bf-437c-b1c8-76815db2aa42"}, {"id":"148b7cc9-0497-4cae-a820-2a921d7624d3"}, {"id":"93682c08-c054-461c-a481-32e157616281"}, {"id":"7a6f1ab2-9af7-4413-8abc-063073dfd0c9"}, {"id":"3cd33348-4df1-49a1-8a8d-7acebe263369"}, {"id":"15256eb9-1731-44dc-8238-1f708d62b87e"}, {"id":"0502305e-94be-40bc-b398-d120bdb79822"}, {"id":"c84060eb-e0a4-4534-8364-957ccbaa297b"}, {"id":"4a1a3a76-04b3-4c64-8597-7bd766d34553"}, {"id":"821a130b-9dd5-4119-835f-13d4ad159cb1"}, {"id":"cb3e8252-b32d-4a42-9652-5417989524aa"}, {"id":"f16c379b-724f-4e4d-bb64-937625795233"}, {"id":"986e96c6-fedc-4f63-aa17-c0be5426b28b"}, {"id":"477d2767-2890-4ade-bbb5-abff941ca088"}, {"id":"13c8ae26-9312-4289-bc6c-73ecdabde12f"}, {"id":"28d2c092-2e59-4807-a245-bf4213886850"}, {"id":"0a4e139c-8fc8-436b-88a1-8c4a561261b2"}, {"id":"c424aef1-8fd2-4fd4-938d-d12e76f1eb92"}, {"id":"ae1652c8-847f-4aa2-8f5e-2c330040dac9"}, {"id":"e03adb34-b9df-445a-bc73-ad154fde8f15"}, {"id":"c58033f5-0059-45b1-a59b-01ec74a4e9d3"}, {"id":"501cdf7e-3009-4c11-8691-00aa2c8c469d"}, {"id":"29bcfa8d-d190-4be2-9ee6-89818326fd9b"}, {"id":"cc3e98a8-c6b1-4938-94c3-15c82887c28b"}, {"id":"672aaf90-52b8-4796-bdb7-e94c339ac74e"}, {"id":"72185695-e71c-405d-9876-d9ecf98efa0e"}, {"id":"d79484ff-3ad6-4f22-8f6f-e0e0a6d02cfa"}, {"id":"65a26bd8-8302-4211-a813-99d4bfd08efb"}, {"id":"cedbd4dd-7e8c-471b-ae78-418494e2489a"}, {"id":"d431fae1-8269-4a3a-8f2e-49b8fa708200"}, {"id":"2ef0ab43-39ca-4ffd-8b10-47b67791c902"}, {"id":"6fcca7b8-1177-4b9a-a4d7-8c3658c412b4"}, {"id":"2b3ba3f3-dd06-4ca3-bb17-8faeeac661a2"}, {"id":"7f4fe2e2-7182-4cc8-904c-c5fa1343158c"}, {"id":"39f3a512-26e0-4213-b148-53e9438cc9ea"}, {"id":"5dee6aa2-6b8d-4812-94cf-b7823e7acda3"}, {"id":"c377fba0-70e9-45ab-85b2-12f97ca1963a"}, {"id":"2aba267c-412a-479d-91dd-a46dc8bcbb9a"}, {"id":"c1cd0460-8cc5-4606-bf57-98b20b948808"}, {"id":"8279c117-ad7b-498d-b3c7-a52c5a2b86d3"}, {"id":"2c1bb6e5-ca67-42fc-a01d-cfe2940c8f89"}, {"id":"e3bc2464-0e16-4c13-aa44-e007fe69f544"}, {"id":"2f44a05c-c504-452a-aaa8-9816a91b6938"}, {"id":"6e08cc72-cfc1-41a4-aa54-fa893fa979b3"}, {"id":"2abc6650-1e15-45e2-b63f-96e9e2700856"}, {"id":"5c09192f-f358-4b72-a342-2bf229c71be3"}, {"id":"b2507e1a-3d5a-4e4d-b143-14b1e6d15b19"}, {"id":"0aa7506c-a6bc-47f0-94ac-c90d35780bde"}, {"id":"96e2e011-da77-482b-ae31-96af78cba68c"}, {"id":"09bc148b-4a75-4488-8ac0-0f7943408c8a"}, {"id":"41a5873e-efc7-4240-9966-cb6e8b572f0a"}, {"id":"1a71c0c5-4248-46aa-b078-9a2cd027da27"}, {"id":"b983d578-b8d3-489a-9ede-b6b01b0bf3d6"}, {"id":"bfa153e6-1f07-4a8b-913a-cddbe3d3e278"}, {"id":"35329cb2-403c-43a4-ae65-9911a7d5f72a"}, {"id":"93c188bf-11f7-40e7-9e3f-cb7f1c337da7"}, {"id":"07d2a5b7-9797-4221-9c12-5f384dc1ca80"}, {"id":"355bf548-cbd7-4ac5-8183-0fc93483f4b1"}, {"id":"1d875cdb-4f2b-45e9-a7e1-aec86c749199"}, {"id":"ca0a7b0a-fe79-47f0-accf-7220bb9003cf"}, {"id":"c1aa8bc3-70f5-4f98-9bf1-678caf2dc3da"}, {"id":"abfc11df-28bb-4c4a-b3b4-9e1b7c7ce0f5"}, {"id":"ebe3100b-748d-422d-b4e4-7ddbefad3947"}, {"id":"4ed8d53e-3798-4e38-a695-019aef42158a"}, {"id":"2da7d16d-b26b-43d8-9c2c-955f3dc31c19"}, {"id":"29f6f8a6-695b-40b9-8dcb-96bbb191f273"}, {"id":"e039a8f7-c98c-428e-aae0-3f0d6fe325cb"}, {"id":"38cc068b-e941-4a59-84c5-eeb66911ea20"}, {"id":"1f33b4ce-767e-4d41-ac9b-f1853410ede6"}, {"id":"7fcdc357-b87c-49f1-a2d5-8fcd3304ee08"}, {"id":"49d2fcd0-b870-472c-ab8b-0fc6423d6130"}, {"id":"125e1b5a-1d10-4e43-b76c-5bb4dfc419ed"}, {"id":"a140cead-24e3-4948-a815-dec1020a8edf"}, {"id":"83b22847-0687-4a34-83c4-63310bc80671"}, {"id":"6c5a8c04-bffd-4878-8228-b8b158e2c7cc"}, {"id":"a3e4fad3-0482-40c3-b6a1-cb91645792fc"}, {"id":"05723387-706f-4c1d-b7ad-05c4b38d7592"}, {"id":"d6fd1e25-ded1-4b3f-9aa0-e6b2c6f05532"}, {"id":"68a94975-1e12-48e6-865f-8643404b7344"}];


var genPost = (num) => {
	var userId = users[num%users.length].id;
	var title = `(${num}) This is a generated Post with al long title.`;
	var content = `(${num}). This is some Content.`;
	for(var j = 0; j < 3; j++) {
		content += content;
	}
	var secret = `Number: (${num}), UserId: (${userId})`;
	return post(title, content, secret, userId);
}

console.log("START");
var data = "";
for(var i = 0; i<100000; i++) {
	data += genPost(i)+"\n";
}
var fs = require("fs");

fs.writeFileSync("posts.sql", data);

