
import 'reflect-metadata';

function dec(foobar: string): any {
  console.log("A", foobar);
  return function (target, propertyKey: string, descriptor: PropertyDescriptor): any {

    const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", target, propertyKey) : undefined;

    console.log("=>", target, propertyKey, descriptor, " => ", reflectMetadataType);
    return target;
  }
}


class Foobar {

  @dec("lol")
  id: string;
}//*/

function logType(target : any, key : string) {
    var t = Reflect.getMetadata("design:type", target, key);
    console.log(`${key} type: ${t.name}`);
}

type id = string | number;

class Lol {
    id: string;
}

class Demo {
    @logType
    public attr1: string;

    @logType @logType
    attr2: number;

    @logType
    attr3: boolean;

    @logType
    attr4: any;

    @logType
    attr5: Lol;

    @logType
    attr6: string[];
}
/*
function d(target: object, key: string): any {
  let val;
  return {
    set: function (value) {
      val = value;
      console.log(`Set ${key} to ${value}`);
    },
    get: function() {
      return val;
    }
  };
}

class Test {
  @d
  p: string;
}

new Test().p = "hello world";//*/